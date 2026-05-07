create table if not exists public.rate_limits (
  key text primary key,
  count int not null default 1,
  window_start timestamptz not null default now()
);

alter table public.rate_limits enable row level security;

create or replace function public.upsert_rate_limit(
  p_key text,
  p_window_start timestamptz,
  p_limit int
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_count int;
begin
  insert into public.rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set count = case
          when rate_limits.window_start < p_window_start then 1
          else rate_limits.count + 1
        end,
        window_start = case
          when rate_limits.window_start < p_window_start then now()
          else rate_limits.window_start
        end
  returning count into v_count;

  return jsonb_build_object(
    'ok', v_count <= p_limit,
    'remaining', greatest(0, p_limit - v_count)
  );
end;
$$;
