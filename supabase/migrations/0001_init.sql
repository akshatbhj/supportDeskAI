
create table if not exists users (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists conversations (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references users(id) on delete cascade,
  status              text not null default 'open'
                        check (status in ('open', 'escalated', 'resolved')),
  classification       text
                        check (classification in ('general_question', 'technical_issue', 'billing', 'urgent')),
  escalation_reason   text,
  escalated_at        timestamptz,
  escalation_notified boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- messages 
create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender          text not null check (sender in ('customer', 'ai', 'system')),
  content         text not null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_conversations_user_id on conversations(user_id);
create index if not exists idx_messages_conversation_id on messages(conversation_id, created_at);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_conversations_updated_at on conversations;
create trigger trg_conversations_updated_at
  before update on conversations
  for each row execute function set_updated_at();

-- Row Level Security
alter table users enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

create policy "Demo: anyone can read users" on users
  for select using (true);

create policy "Demo: anyone can read conversations" on conversations
  for select using (true);
create policy "Demo: anyone can insert conversations" on conversations
  for insert with check (true);
create policy "Demo: anyone can update conversations" on conversations
  for update using (true);

create policy "Demo: anyone can read messages" on messages
  for select using (true);
create policy "Demo: anyone can insert messages" on messages
  for insert with check (true);

-- Seed demo users 
insert into users (id, name, email) values
  ('11111111-1111-1111-1111-111111111111', 'Amar Singh', 'amar@customer.test'),
  ('22222222-2222-2222-2222-222222222222', 'Priya Yadav', 'priya@raftlabs.test'),
  ('33333333-3333-3333-3333-333333333333', 'Akshat Bhardwaj', 'akshat@softwaredeveloperintern.test'),
  ('44444444-4444-4444-4444-444444444444', 'Ayush Kumar', 'ayush@kumar.test')
on conflict (email) do nothing;