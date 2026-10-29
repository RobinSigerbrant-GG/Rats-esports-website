grant update (game_name, tag_line, team, role) on public.soloq_players to authenticated;
create policy "Admins can edit players" on public.soloq_players for update to authenticated using (exists(select 1 from public.soloq_admins where user_id = (select auth.uid()))) with check (exists(select 1 from public.soloq_admins where user_id = (select auth.uid())));
