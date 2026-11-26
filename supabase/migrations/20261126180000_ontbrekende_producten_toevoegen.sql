-- Ontbrekende producten toevoegen op basis van een vergelijking met sonilux.nl
-- (op verzoek van Andy). Vier producten stonden op de live website maar nog
-- niet in de database: Cocktailbar (LED Barren) en drie kerstproducten
-- (Kerststerren 3D, Arabesk, Droplight), die net als Kersthuisjes/Mini
-- Marktkraam onder "Evenementen" vallen -- er is geen apart "Kerst"-categorie.
-- Alles direct op voorraad/actief, zoals gevraagd.

insert into public.products
  (category_id, slug, name, short_description, description, dimensions, event_types, in_stock, is_active)
values
  (
    (select id from public.product_categories where slug = 'led-barren'),
    'cocktailbar',
    'Cocktailbar',
    'Sfeervolle LED-cocktailbar van het Italiaanse merk Slide, het middelpunt van elke bar-opstelling.',
    'Onze Cocktailbar is de blikvanger van elke bar-opstelling. Met vaste verlichting (de hele avond aan) of op accu (circa 8 uur) is hij overal inzetbaar. De kleur is zelf instelbaar met de afstandsbediening. Combineer de Cocktailbar met de Ice Cube en Snackbar voor een complete barcirkel.',
    null,
    array['bruiloft', 'verjaardag', 'bedrijfsfeest', 'festival', 'jubileum', 'communie'],
    true,
    true
  ),
  (
    (select id from public.product_categories where slug = 'evenementen'),
    'kerststerren-3d',
    'Kerststerren 3D',
    'Traditionele 3D lichtster, verkrijgbaar in twee formaten, voor binnen en buiten.',
    'Onze best verkochte kerstdecoratie. De 3D ster is veelzijdig inzetbaar: op de grond of hangend, horizontaal of verticaal.',
    '100 x 100 x 10 cm / 200 x 200 x 30 cm - 24V',
    array['kerstmarkt', 'festival', 'overig'],
    true,
    true
  ),
  (
    (select id from public.product_categories where slug = 'evenementen'),
    'arabesk',
    'Arabesk',
    'Lichtgevende boog met lasersneden gouden bladeren, decoreerbaar met kerstballen of guirlande.',
    'De Arabesk heeft lichtgevende curves en lasersneden gouden bladeren voor een natuurlijke, betoverende uitstraling. Te versieren met kerstballen of een guirlande.',
    '300 x 70 cm - 24V',
    array['kerstmarkt', 'festival', 'overig'],
    true,
    true
  ),
  (
    (select id from public.product_categories where slug = 'evenementen'),
    'droplight',
    'Droplight',
    'Lichtgordijn met warmwitte LED''s, te koppelen aan andere kerstproducten.',
    'De Droplights zijn lichtgordijnen van 230V, speciaal ontworpen om lange lichtlinten over gebouwen te laten schijnen. Te koppelen aan andere producten uit de reeks.',
    '300 x 200 cm',
    array['kerstmarkt', 'festival', 'overig'],
    true,
    true
  );
