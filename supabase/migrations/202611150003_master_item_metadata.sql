alter table public.master_items add column metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object');
