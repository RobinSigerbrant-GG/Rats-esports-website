create table public.soloq_award_matches (
  player_id uuid not null references public.soloq_players(id) on delete cascade,
  identity text not null,
  source text not null check(source in ('opgg','riot')),
  match_id text not null check(length(match_id) between 1 and 160),
  played_at timestamptz not null,
  result text not null check(result in ('WIN','LOSE')),
  champion text not null check(length(champion) between 1 and 160),
  position text not null check(length(position) between 1 and 160),
  kills integer not null check(kills between 0 and 100000),
  deaths integer not null check(deaths between 0 and 100000),
  assists integer not null check(assists between 0 and 100000),
  cs integer not null check(cs between 0 and 100000),
  op_score numeric check(op_score between 0 and 10),
  op_score_rank integer check(op_score_rank between 1 and 10),
  primary key(player_id,identity,source,match_id)
);
create index soloq_award_matches_recent on public.soloq_award_matches(player_id,identity,source,played_at desc);
alter table public.soloq_award_matches enable row level security;
revoke all on public.soloq_award_matches from public,anon,authenticated;
grant select on public.soloq_award_matches to anon,authenticated;
create policy "Read saved public SoloQ matches" on public.soloq_award_matches for select to anon,authenticated using(true);

create function rats_internal.record_soloq_matches(p_secret text,p_source text,p_rows jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare affected integer;
begin
  if not exists(select 1 from public.soloq_admins where user_id=(select auth.uid()))
     and not exists(select 1 from rats_internal.soloq_sync_key where secret_hash=encode(sha256(convert_to(coalesce(p_secret,''),'UTF8')),'hex')) then
    raise exception 'Match writer is not authorized' using errcode='42501';
  end if;
  if p_source is null or p_source not in ('opgg','riot') or p_rows is null or jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>1000 then raise exception 'Invalid match batch'; end if;
  if exists(select 1 from jsonb_array_elements(p_rows) r where jsonb_typeof(r->'games') is distinct from 'array' or jsonb_array_length(r->'games')>20) then raise exception 'Invalid games'; end if;
  insert into public.soloq_award_matches(player_id,identity,source,match_id,played_at,result,champion,position,kills,deaths,assists,cs,op_score,op_score_rank)
  select distinct on (p.id,r.identity,m.id) p.id,r.identity,p_source,m.id,m."playedAt",m.result,m.champion,m.position,m.kills,m.deaths,m.assists,m.cs,m."opScore",m."opScoreRank"
  from jsonb_to_recordset(p_rows) as r(player_id uuid,identity text,games jsonb)
  join public.soloq_players p on p.id=r.player_id and lower(p.game_name||'#'||p.tag_line)=r.identity
  cross join lateral jsonb_to_recordset(r.games) as m(id text,"playedAt" timestamptz,result text,champion text,position text,kills integer,deaths integer,assists integer,cs integer,"opScore" numeric,"opScoreRank" integer)
  where m.result in ('WIN','LOSE') and m."playedAt"<=now()+interval '5 minutes'
  order by p.id,r.identity,m.id,m."playedAt" desc
  on conflict(player_id,identity,source,match_id) do update set played_at=excluded.played_at,result=excluded.result,champion=excluded.champion,position=excluded.position,kills=excluded.kills,deaths=excluded.deaths,assists=excluded.assists,cs=excluded.cs,op_score=excluded.op_score,op_score_rank=excluded.op_score_rank;
  get diagnostics affected=row_count;
  with ranked as (select player_id,identity,source,match_id,row_number() over(partition by player_id,identity,source order by played_at desc,match_id) as rn from public.soloq_award_matches)
  delete from public.soloq_award_matches m using ranked r where r.rn>20 and m.player_id=r.player_id and m.identity=r.identity and m.source=r.source and m.match_id=r.match_id;
  return jsonb_build_object('recorded',affected);
end;
$$;
revoke all on function rats_internal.record_soloq_matches(text,text,jsonb) from public;
grant execute on function rats_internal.record_soloq_matches(text,text,jsonb) to anon,authenticated;
create function public.record_soloq_matches(p_secret text,p_source text,p_rows jsonb)
returns jsonb language sql security invoker set search_path='' as $$ select rats_internal.record_soloq_matches(p_secret,p_source,p_rows); $$;
revoke all on function public.record_soloq_matches(text,text,jsonb) from public;
grant execute on function public.record_soloq_matches(text,text,jsonb) to anon,authenticated;

create function public.read_soloq_matches(p_source text)
returns jsonb language sql stable security invoker set search_path='' as $$
select coalesce(jsonb_agg(jsonb_build_object('playerId',p.id,'games',(
 select coalesce(jsonb_agg(jsonb_build_object('id',m.match_id,'playedAt',m.played_at,'result',m.result,'champion',m.champion,'position',m.position,'kills',m.kills,'deaths',m.deaths,'assists',m.assists,'cs',m.cs,'opScore',m.op_score,'opScoreRank',m.op_score_rank) order by m.played_at desc,m.match_id),'[]'::jsonb)
 from public.soloq_award_matches m where m.player_id=p.id and m.identity=lower(p.game_name||'#'||p.tag_line) and m.source=p_source
))),'[]'::jsonb) from public.soloq_players p;
$$;
revoke all on function public.read_soloq_matches(text) from public;
grant execute on function public.read_soloq_matches(text) to anon,authenticated;
