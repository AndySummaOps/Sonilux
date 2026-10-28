-- WhatsApp-aanvragen opslaan + inbox voor Rick in het admin-scherm.
--
-- 1. quote_requests krijgt de velden die de bot verzamelt (locatie, type event)
--    en een koppeling naar het WhatsApp-gesprek. Status 'aangepast' erbij
--    (Rick accepteert of past aan).
-- 2. conversations onthoudt waarom en wanneer het gesprek naar Rick ging.
-- 3. Alleen de admin (app_metadata.role = 'admin') mag gesprekken, berichten,
--    klanten en aanvragen lezen en de status ervan wijzigen. Niet zomaar
--    "authenticated": dan zou elk account dat zich aanmeldt klantgegevens zien.

alter table public.quote_requests
  add column conversation_id uuid references public.conversations(id) on delete set null,
  add column location text,
  add column event_type text,
  add column source text not null default 'website',
  add constraint quote_requests_source_check check (source in ('website', 'whatsapp'));

alter table public.quote_requests drop constraint quote_requests_status_check;
alter table public.quote_requests add constraint quote_requests_status_check check (
  status in ('nieuw', 'in_behandeling', 'offerte_verstuurd', 'geaccepteerd', 'aangepast', 'geweigerd')
);

create index quote_requests_conversation_id_idx on public.quote_requests (conversation_id);

alter table public.conversations
  add column handover_reason text,
  add column handover_at timestamptz;

comment on column public.quote_requests.source is 'Herkomst: website (formulier) of whatsapp (bot).';
comment on column public.conversations.handover_reason is 'Waarom de bot het gesprek aan Rick gaf (klant_wil_mens / prijs_korting_garantie / weet_het_niet).';

-- Admin-rol op het bestaande admin-account (er is precies één gebruiker).
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb;

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

create policy "Admin leest gesprekken" on public.conversations
  for select to authenticated using (public.is_admin());
create policy "Admin wijzigt gesprekken" on public.conversations
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Admin leest berichten" on public.messages
  for select to authenticated using (public.is_admin());

create policy "Admin leest klanten" on public.customers
  for select to authenticated using (public.is_admin());

create policy "Admin leest aanvragen" on public.quote_requests
  for select to authenticated using (public.is_admin());
create policy "Admin wijzigt aanvragen" on public.quote_requests
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Admin leest aanvraagregels" on public.quote_request_items
  for select to authenticated using (public.is_admin());
