alter table public.soloq_players drop constraint soloq_players_team_check;
alter table public.soloq_players add constraint soloq_players_team_check check (team in ('RATS ESPORTS','RATS PUNGH','RATS IRON','RATS MCD','Asiatkompisarna','Medlem'));
