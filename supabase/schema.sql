-- Ejecuta este archivo en Supabase > SQL Editor
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);
create table if not exists finance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  type text not null check (type in ('deposito','inversion','retiro','gasto','ingreso')),
  amount numeric not null,
  note text default '',
  created_at timestamptz default now()
);
alter table finance add column if not exists money_type text not null default 'limpio' check (money_type in ('limpio','negro'));
create table if not exists drugs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stock int not null default 0,
  sold int not null default 0,
  craft_cost numeric not null default 0,
  sell_price numeric not null default 0
);
alter table drug_sales add column if not exists money_type text not null default 'limpio' check (money_type in ('limpio','negro'));
alter table drugs add column if not exists emoji text not null default '💊';
create table if not exists drug_sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  drug_id uuid references drugs(id) on delete cascade,
  qty int not null,
  unit_price numeric not null,
  created_at timestamptz default now()
);
alter table drug_sales add column if not exists kind text not null default 'venta' check (kind in ('ingreso','venta'));
create table if not exists drug_materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('semilla','hoja')),
  stock int not null default 0
);
create table if not exists drug_material_moves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  material_id uuid references drug_materials(id) on delete cascade,
  kind text not null check (kind in ('ingreso','consumo')),
  qty int not null,
  note text default '',
  created_at timestamptz default now()
);
create table if not exists weapons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  serial text default '',
  owner_user_id uuid references users(id),
  status text default 'en inventario',
  note text default '',
  created_at timestamptz default now()
);
alter table weapons add column if not exists stock int not null default 0;
alter table weapons add column if not exists value numeric not null default 0;
create table if not exists weapon_moves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  weapon_id uuid references weapons(id) on delete cascade,
  kind text not null check (kind in ('ingreso','retiro','compra','venta')),
  qty int not null,
  unit_price numeric not null default 0,
  note text default '',
  created_at timestamptz default now()
);
alter table weapon_moves drop constraint if exists weapon_moves_kind_check;
alter table weapon_moves add constraint weapon_moves_kind_check check (kind in ('ingreso','retiro','compra','venta'));
update weapon_moves set kind = 'compra' where kind = 'ingreso' and unit_price > 0;
alter table weapons add column if not exists emoji text not null default '🔫';
alter table weapon_moves add column if not exists money_type text not null default 'limpio' check (money_type in ('limpio','negro'));
create table if not exists weapon_parts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stock int not null default 0,
  note text default '',
  created_at timestamptz default now()
);
create table if not exists weapon_part_moves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  part_id uuid references weapon_parts(id) on delete cascade,
  kind text not null check (kind in ('ingreso','retiro')),
  qty int not null,
  note text default '',
  created_at timestamptz default now()
);
create table if not exists drug_supplies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stock int not null default 0,
  note text default '',
  created_at timestamptz default now()
);
create table if not exists drug_supply_moves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  item_id uuid references drug_supplies(id) on delete cascade,
  kind text not null check (kind in ('ingreso','retiro','compra')),
  qty int not null,
  unit_price numeric not null default 0,
  money_type text not null default 'limpio' check (money_type in ('limpio','negro')),
  note text default '',
  created_at timestamptz default now()
);
create table if not exists tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stock int not null default 0,
  note text default '',
  created_at timestamptz default now()
);
create table if not exists tool_moves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  item_id uuid references tools(id) on delete cascade,
  kind text not null check (kind in ('ingreso','retiro','compra')),
  qty int not null,
  unit_price numeric not null default 0,
  money_type text not null default 'limpio' check (money_type in ('limpio','negro')),
  note text default '',
  created_at timestamptz default now()
);
create table if not exists tool_parts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stock int not null default 0,
  note text default '',
  created_at timestamptz default now()
);
create table if not exists tool_part_moves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  item_id uuid references tool_parts(id) on delete cascade,
  kind text not null check (kind in ('ingreso','retiro','compra')),
  qty int not null,
  unit_price numeric not null default 0,
  money_type text not null default 'limpio' check (money_type in ('limpio','negro')),
  note text default '',
  created_at timestamptz default now()
);
create table if not exists heists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  loot numeric not null default 0,
  participants text default '',
  weapons_used text default '',
  note text default '',
  created_at timestamptz default now()
);
alter table heists add column if not exists loot_type text not null default 'limpio';
alter table heists drop constraint if exists heists_loot_type_check;
alter table heists add constraint heists_loot_type_check check (loot_type in ('limpio','negro','materiales'));
alter table heists add column if not exists user_id uuid references users(id);
alter table heists add column if not exists loot_item text not null default '';
create table if not exists fines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  kind text not null check (kind in ('multa','paga')),
  amount numeric not null,
  reason text default '',
  paid boolean default false,
  created_at timestamptz default now()
);
create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  item text not null,
  qty int not null default 0
);
create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  kind text not null check (kind in ('ingreso','retiro')),
  material text not null check (material in ('chatarra','plastico')),
  qty int not null,
  note text default '',
  created_at timestamptz default now()
);
alter table materials drop constraint if exists materials_material_check;
alter table materials add constraint materials_material_check check (material in ('chatarra','plastico','polvora'));
create table if not exists houses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  loot numeric not null default 0,
  participants text default '',
  note text default '',
  created_at timestamptz default now()
);
alter table houses add column if not exists user_id uuid references users(id);
alter table houses add column if not exists qty int not null default 1;
create table if not exists logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  user_name text,
  action text not null,
  entity text not null,
  detail jsonb default '{}',
  created_at timestamptz default now()
);

-- Acceso abierto (la app no restringe acciones por diseño)
do $$
declare t text;
begin
  foreach t in array array['users','finance','drugs','drug_sales','drug_materials','drug_material_moves','weapons','weapon_moves','weapon_parts','weapon_part_moves','tools','tool_moves','tool_parts','tool_part_moves','drug_supplies','drug_supply_moves','heists','fines','inventory','materials','houses','logs']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "open" on %I', t);
    execute format('create policy "open" on %I for all using (true) with check (true)', t);
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- Refrescar la caché de esquema de la API
notify pgrst, 'reload schema';
