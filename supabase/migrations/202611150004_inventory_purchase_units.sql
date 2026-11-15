alter table public.inventory_items
 add column purchase_quantity numeric(14,4) check (purchase_quantity > 0),
 add column purchase_unit text check (purchase_unit in ('g','kg','lb','oz','ml','l','fl oz','each','unit','piece','pcs')),
 add column markup_percent numeric(7,2) not null default 0 check (markup_percent >= 0),
 add constraint inventory_purchase_pair check ((purchase_quantity is null) = (purchase_unit is null));