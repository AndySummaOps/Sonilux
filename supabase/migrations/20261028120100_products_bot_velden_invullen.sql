-- Botvelden per product invullen (voorstel Claude op basis van de
-- productomschrijvingen; pas toepassen na akkoord van Andy/Rick).
--
-- min_guests/max_guests blijven leeg: het zijn losse stuks die Rick per aantal
-- verhuurt, dus een gastenaantal per product zegt weinig. Het aantal gasten
-- gaat wel mee in de aanvraag, zodat Rick de hoeveelheid kan bepalen.

update public.products set event_types = case name
  when 'LED Kubus'         then array['bruiloft', 'verjaardag', 'bedrijfsfeest', 'festival', 'jubileum', 'communie']
  when 'Statafel Rond'     then array['bruiloft', 'verjaardag', 'bedrijfsfeest', 'festival', 'beurs', 'jubileum', 'communie']
  when 'Statafel Vierkant' then array['bruiloft', 'verjaardag', 'bedrijfsfeest', 'festival', 'beurs', 'jubileum', 'communie']
  when 'Snackbar'          then array['bruiloft', 'verjaardag', 'bedrijfsfeest', 'festival', 'jubileum', 'communie']
  when 'Ice Cube'          then array['bruiloft', 'verjaardag', 'bedrijfsfeest', 'festival', 'jubileum']
  when 'Lantaarnpaal'      then array['bruiloft', 'bedrijfsfeest', 'kerstmarkt', 'jubileum', 'beurs']
  when 'LED Spot'          then array['bruiloft', 'verjaardag', 'bedrijfsfeest', 'festival', 'beurs', 'jubileum']
  when 'Uplight'           then array['bruiloft', 'verjaardag', 'bedrijfsfeest', 'beurs', 'jubileum', 'communie']
  when 'Prikkabel'         then array['bruiloft', 'verjaardag', 'bedrijfsfeest', 'festival', 'kerstmarkt', 'jubileum', 'communie']
  when 'Kersthuisjes'      then array['kerstmarkt', 'festival', 'overig']
  when 'Mini Marktkraam'   then array['kerstmarkt', 'festival', 'overig']
  else event_types
end;
