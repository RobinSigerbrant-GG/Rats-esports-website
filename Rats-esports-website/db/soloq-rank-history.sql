create schema if not exists rats_internal;
revoke all on schema rats_internal from public;
grant usage on schema rats_internal to anon, authenticated;
create table rats_internal.soloq_sync_key (
  id boolean primary key default true check (id),
  secret_hash text not null check (length(secret_hash)=64)
);
alter table rats_internal.soloq_sync_key enable row level security;
revoke all on rats_internal.soloq_sync_key from public, anon, authenticated;

create table public.soloq_rank_history (
  player_id uuid not null references public.soloq_players(id) on delete cascade,
  identity text not null,
  source text not null check (source in ('opgg','riot')),
  bucket timestamptz not null,
  observed_at timestamptz not null,
  tier text not null check (tier in ('IRON','BRONZE','SILVER','GOLD','PLATINUM','EMERALD','DIAMOND','MASTER','GRANDMASTER','CHALLENGER')),
  division text not null check (division in ('I','II','III','IV')),
  lp integer not null check (lp between 0 and 100000),
  wins integer not null check (wins between 0 and 100000),
  losses integer not null check (losses between 0 and 100000),
  club_position integer check (club_position>0),
  primary key (player_id, identity, source, bucket)
);
create index soloq_history_lookup on public.soloq_rank_history(player_id,identity,source,observed_at desc);
alter table public.soloq_rank_history enable row level security;
revoke all on public.soloq_rank_history from public, anon, authenticated;
grant select on public.soloq_rank_history to anon, authenticated;
create policy "Public official rank history" on public.soloq_rank_history for select to anon, authenticated using (true);

-- A narrow server writer, not general database access. The server credential is
-- configured separately as a hash here and an encrypted Vercel variable.
-- Existing admins are also checked through their verified auth.uid().
create function rats_internal.record_soloq_history(p_secret text,p_source text,p_rows jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare affected integer;
begin
  if not exists(select 1 from public.soloq_admins where user_id=(select auth.uid()))
     and not exists(select 1 from rats_internal.soloq_sync_key where secret_hash=encode(sha256(convert_to(coalesce(p_secret,''),'UTF8')),'hex')) then
    raise exception 'History writer is not authorized' using errcode='42501';
  end if;
  if p_source not in ('opgg','riot') or p_rows is null or jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>1000 then
    raise exception 'Invalid history batch';
  end if;
  insert into public.soloq_rank_history(player_id,identity,source,bucket,observed_at,tier,division,lp,wins,losses,club_position)
  select r.player_id,r.identity,p_source,date_bin(interval '15 minutes',r.observed_at,timestamptz '2000-01-01 00:00:00+00'),r.observed_at,r.tier,r.division,r.lp,r.wins,r.losses,r.club_position
  from jsonb_to_recordset(p_rows) as r(player_id uuid,identity text,observed_at timestamptz,tier text,division text,lp integer,wins integer,losses integer,club_position integer)
  join public.soloq_players p on p.id=r.player_id and lower(p.game_name||'#'||p.tag_line)=r.identity
  where r.observed_at between now()-interval '2 days' and now()+interval '5 minutes'
  on conflict(player_id,identity,source,bucket) do update set observed_at=excluded.observed_at,tier=excluded.tier,division=excluded.division,lp=excluded.lp,wins=excluded.wins,losses=excluded.losses,club_position=excluded.club_position
  where excluded.observed_at>soloq_rank_history.observed_at;
  get diagnostics affected=row_count;
  return jsonb_build_object('recorded',affected);
end;
$$;
revoke all on function rats_internal.record_soloq_history(text,text,jsonb) from public;
grant execute on function rats_internal.record_soloq_history(text,text,jsonb) to anon, authenticated;
create function public.record_soloq_history(p_secret text,p_source text,p_rows jsonb)
returns jsonb language sql security invoker set search_path='' as $$
  select rats_internal.record_soloq_history(p_secret,p_source,p_rows);
$$;
revoke all on function public.record_soloq_history(text,text,jsonb) from public;
grant execute on function public.record_soloq_history(text,text,jsonb) to anon, authenticated;

create function public.read_soloq_history(p_source text)
returns jsonb language sql stable security invoker set search_path='' as $$
select coalesce(jsonb_agg(jsonb_build_object(
  'playerId',p.id,
  'first',(select jsonb_build_object('observed_at',h.observed_at,'tier',h.tier,'rank',h.division,'lp',h.lp,'wins',h.wins,'losses',h.losses,'club_position',h.club_position) from public.soloq_rank_history h where h.player_id=p.id and h.identity=lower(p.game_name||'#'||p.tag_line) and h.source=p_source order by h.observed_at asc limit 1),
  'week',(select jsonb_build_object('observed_at',h.observed_at,'tier',h.tier,'rank',h.division,'lp',h.lp,'wins',h.wins,'losses',h.losses,'club_position',h.club_position) from public.soloq_rank_history h where h.player_id=p.id and h.identity=lower(p.game_name||'#'||p.tag_line) and h.source=p_source and h.observed_at between now()-interval '8 days' and now()-interval '7 days' order by h.observed_at desc limit 1),
  'points',(select coalesce(jsonb_agg(jsonb_build_object('observed_at',q.observed_at,'tier',q.tier,'rank',q.division,'lp',q.lp,'wins',q.wins,'losses',q.losses,'club_position',q.club_position) order by q.observed_at),'[]'::jsonb) from (select h.* from public.soloq_rank_history h where h.player_id=p.id and h.identity=lower(p.game_name||'#'||p.tag_line) and h.source=p_source order by h.observed_at desc limit 60) q)
)),'[]'::jsonb) from public.soloq_players p;
$$;
revoke all on function public.read_soloq_history(text) from public;
grant execute on function public.read_soloq_history(text) to anon, authenticated;
