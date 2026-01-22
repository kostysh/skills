# Database Functions & Triggers

## Function template
```sql
create or replace function public.my_function(param_id bigint)
returns json
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result json;
begin
  select json_build_object('id', id, 'name', name)
  into result
  from public.my_table
  where id = my_function.param_id;

  return result;
end;
$$;
```

## Trigger template
```sql
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_update_timestamp
before update on public.my_table
for each row
execute function public.handle_updated_at();
```

## Rules
- Default to `security invoker`.
- Always set `search_path = ''`.
- Use fully qualified names (`schema.table`).
- Prefer `immutable` or `stable` when possible.
