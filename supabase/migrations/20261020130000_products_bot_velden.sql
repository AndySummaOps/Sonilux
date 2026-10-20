-- Extra productvelden voor de WhatsApp-assistent.
--
-- Omschrijving: bestaat al als `description` (+ `short_description`), dus geen
-- nieuwe kolom. De bot gebruikt die bestaande velden.
--
-- in_stock wordt eenmalig overgenomen van is_active (akkoord Andy, 2026-10-20).
-- event_types en min/max_guests blijven leeg tot Rick ze invult.

alter table public.products
  -- Op voorraad ja/nee. Los van is_active (= zichtbaar op de website) en van
  -- stock_quantity (aantal stuks). Beschikbaarheid per datum checkt Rick zelf.
  -- De bot stelt alleen producten voor met in_stock = true.
  add column in_stock boolean not null default true,
  -- Voor welke soorten events het product geschikt is, bv. {bruiloft,bedrijfsfeest}.
  add column event_types text[] not null default '{}',
  -- Indicatie voor hoeveel gasten het product geschikt is (beide optioneel).
  add column min_guests integer,
  add column max_guests integer,
  add constraint products_guests_check check (
    (min_guests is null or min_guests > 0)
    and (max_guests is null or max_guests > 0)
    and (min_guests is null or max_guests is null or min_guests <= max_guests)
  ),
  add constraint products_event_types_check check (
    event_types <@ array[
      'bruiloft', 'verjaardag', 'bedrijfsfeest', 'festival', 'beurs',
      'kerstmarkt', 'communie', 'jubileum', 'overig'
    ]::text[]
  );

update public.products set in_stock = is_active;

comment on column public.products.in_stock is 'Op voorraad ja/nee; de WhatsApp-bot stelt alleen producten met true voor.';
comment on column public.products.event_types is 'Eventtypes waarvoor het product geschikt is.';
comment on column public.products.min_guests is 'Indicatie: geschikt vanaf dit aantal gasten.';
comment on column public.products.max_guests is 'Indicatie: geschikt tot dit aantal gasten.';
