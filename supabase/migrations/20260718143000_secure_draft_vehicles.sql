-- Keep unpublished dealer inventory private and prevent arbitrary vehicle edits.
drop policy if exists "Allow public read access" on public.vehicles;
drop policy if exists "Vehicles are viewable by everyone" on public.vehicles;
drop policy if exists "Allow public update access" on public.vehicles;

create policy "Published vehicles are public; drafts belong to their seller"
on public.vehicles
for select
using (
  lower(coalesce(status, '')) <> 'draft'
  or auth.uid() = seller_id
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Sellers can update their own vehicles"
on public.vehicles
for update
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);
