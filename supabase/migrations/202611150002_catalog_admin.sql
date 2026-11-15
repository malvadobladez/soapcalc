create policy "Catalog admins insert items" on public.master_items for insert to authenticated
with check ((select auth.jwt()->'app_metadata'->>'catalog_admin') = 'true');
create policy "Catalog admins update items" on public.master_items for update to authenticated
using ((select auth.jwt()->'app_metadata'->>'catalog_admin') = 'true')
with check ((select auth.jwt()->'app_metadata'->>'catalog_admin') = 'true');
grant insert (name,item_class,category,form,is_active), update (name,item_class,category,form,is_active)
on public.master_items to authenticated;
