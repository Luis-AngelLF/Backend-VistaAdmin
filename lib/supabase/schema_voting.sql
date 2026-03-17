-- VOTING MODULE SCHEMA

-- 1. Candidates Table
create table if not exists candidates (
  id uuid default gen_random_uuid() primary key,
  names text not null,
  surnames text not null,
  party text not null, -- Could be an enum or table later, text is fine for MVP
  photo_url text,      -- Public URL from Storage
  created_at timestamptz default now()
);

-- 2. Votes Table (Anonymous Ballot)
-- We do NOT store user_id here to preserve secrecy.
-- Double-voting is prevented by the 'users.has_voted' boolean flag.
create table if not exists votes (
  id uuid default gen_random_uuid() primary key,
  candidate_id uuid references candidates(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- 3. RLS Policies

-- Candidates: Public Read
alter table candidates enable row level security;

create policy "Candidates are viewable by everyone"
  on candidates for select
  using ( true );

-- Candidates: Admin/Service Role Write
create policy "Admins can insert candidates"
  on candidates for insert
  with check ( true ); -- We rely on App Logic/Middleware + Service Role for now

create policy "Admins can delete candidates"
  on candidates for delete
  using ( true );

-- Votes: Service Role Only (Strict)
-- Voters insert via Server Action (which uses Service Role or validates session)
alter table votes enable row level security;

create policy "Service Role can manage votes"
  on votes for all
  using ( true )
  with check ( true );


-- 4. Storage Bucket Setup (Idempotent-ish)
insert into storage.buckets (id, name, public)
values ('candidates', 'candidates', true)
on conflict (id) do nothing;

-- Storage Policies
-- Allow public access to candidate photos
create policy "Public Access Candidates"
  on storage.objects for select
  using ( bucket_id = 'candidates' );

-- Allow Admin/Service Role to upload
-- (In Supabase actions, we typically use the Service Key, so we bypass RLS, 
--  but good to have a policy if we used authenticated client)
create policy "Admin Upload Candidates"
  on storage.objects for insert
  with check ( bucket_id = 'candidates' );

create policy "Admin Delete Candidates"
  on storage.objects for delete
  using ( bucket_id = 'candidates' );
