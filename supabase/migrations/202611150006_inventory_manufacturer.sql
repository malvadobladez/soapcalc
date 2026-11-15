alter table public.inventory_items add column manufacturer text check (char_length(manufacturer) <= 120);
