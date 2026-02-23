create extension if not exists "pgcrypto";

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(10) not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint jobs_user_id_name_key unique (user_id, name),
  constraint jobs_user_id_id_key unique (user_id, id)
);

create index if not exists jobs_user_id_idx on public.jobs (user_id);

create table if not exists public.current_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint current_jobs_user_id_key unique (user_id),
  constraint current_jobs_user_id_job_id_fkey
    foreign key (user_id, job_id)
    references public.jobs(user_id, id)
    on delete set null
);

create index if not exists current_jobs_job_id_idx on public.current_jobs (job_id);

create table if not exists public.work_times (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null,
  year int not null,
  month int not null,
  date int not null,
  "index" int not null check ("index" >= 0),
  acted_at timestamptz not null,
  status text not null check (status in ('working', 'resting', 'workOff')),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint work_times_year_month_date_check check (
    year >= 2000
    and month between 1 and 12
    and date between 1 and 31
  ),
  constraint work_times_user_id_job_id_fkey
    foreign key (user_id, job_id)
    references public.jobs(user_id, id)
    on delete cascade,
  constraint work_times_acted_at_matches_date_parts_check check (
    extract(year from acted_at at time zone 'Asia/Tokyo')::int = year
    and extract(month from acted_at at time zone 'Asia/Tokyo')::int = month
    and extract(day from acted_at at time zone 'Asia/Tokyo')::int = date
  )
);

create index if not exists work_times_user_id_acted_at_idx on public.work_times (user_id, acted_at);
create index if not exists work_times_user_id_year_month_idx on public.work_times (user_id, year, month);
create index if not exists work_times_job_id_year_month_date_idx
  on public.work_times (job_id, year, month, date);
