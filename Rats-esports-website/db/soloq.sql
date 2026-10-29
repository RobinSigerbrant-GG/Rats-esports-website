create table public.soloq_admins (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.soloq_admins enable row level security;
grant select on public.soloq_admins to authenticated;
create policy "Admins can read own membership" on public.soloq_admins for select to authenticated using ((select auth.uid()) = user_id);
create table public.soloq_players (
 id uuid primary key default gen_random_uuid(),
 game_name text not null check (length(trim(game_name)) between 3 and 16),
 tag_line text not null check (length(trim(tag_line)) between 3 and 5),
 team text not null default 'Medlem' check (team in ('RATS ESPORTS','RATS PUNGH','RATS IRON','RATS MCD','Medlem')),
 role text not null default 'Fill' check (role in ('Top','Jungle','Mid','Bot','Support','Fill')),
 created_at timestamptz not null default now()
);
create unique index soloq_players_riot_id on public.soloq_players (lower(game_name), lower(tag_line));
alter table public.soloq_players enable row level security;
grant select on public.soloq_players to anon, authenticated;
grant insert, delete on public.soloq_players to authenticated;
create policy "Public leaderboard roster" on public.soloq_players for select to anon, authenticated using (true);
create policy "Admins can add players" on public.soloq_players for insert to authenticated with check (exists(select 1 from public.soloq_admins where user_id = (select auth.uid())));
create policy "Admins can remove players" on public.soloq_players for delete to authenticated using (exists(select 1 from public.soloq_admins where user_id = (select auth.uid())));
insert into public.soloq_players (game_name,tag_line,team,role) values
('RAT Swedishking','RATS','RATS PUNGH','Top'),('RAT Vmuuz','nr1','RATS PUNGH','Jungle'),('Mufasa','Yeah','RATS PUNGH','Mid'),('DBR Derph','DBR','RATS PUNGH','Bot'),
('Rat gryb','1337','RATS IRON','Top'),('RAT Krankee','1337','RATS IRON','Jungle'),('RAT Teammate','2626','RATS IRON','Mid'),('RAT Snuskmackan','IRON','RATS IRON','Bot'),('RAT WeeYeah','IRON','RATS IRON','Support'),
('RAT Veino','RATS','RATS MCD','Top'),('Nikita Rósa','Upir','RATS MCD','Jungle'),('Blex','haha','RATS MCD','Mid'),('Yuzu','Junos','RATS MCD','Bot'),('RAT M34N','RATS','RATS MCD','Support');
