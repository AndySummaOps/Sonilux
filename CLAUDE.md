# Sonilux — website + WhatsApp-assistent

Deze repo (GitHub `AndySummaOps/Sonilux`) bevat de Next.js-website van Sonilux én de Supabase Edge Functions voor de WhatsApp-chatbot. Opdrachtgever/developer-contact: Andy (SummaOps). Klant: Sonilux, verhuur van eventproducten (bars, LED-verlichting). Eigenaar: Rik.

## WhatsApp-bot: doel
NL WhatsApp-assistent, 24/7: beantwoordt vragen, stelt passende producten voor en verzamelt een aanvraag. **De bot beslist niets** — Rik accepteert of past aan.

## Stack
Meta WhatsApp Cloud API → Supabase Edge Function → Google Gemini → antwoord via Graph API.

- Supabase-project `sonilux`, id `fbcwvwukdeqowtcuzrgn`.
- Edge Functions (code in `supabase/functions/`):
  - `whatsapp-webhook-meta` — **de actieve Meta + Gemini-bot.** Slaat bevestigde aanvragen op in `quote_requests` (source `whatsapp`) en meldt aanvragen en overdrachten via WhatsApp aan Rik (`notify.ts`).
  - `admin-send-message` — Rik antwoordt een klant vanuit het admin-scherm (tabblad Gesprekken). Alleen voor accounts met `app_metadata.role = 'admin'`.
  - `_shared/whatsapp.ts` — versturen via de Meta Cloud API (tekst en templates).
  - `whatsapp-webhook` — oude Twilio + Claude Haiku-versie (legacy, niet meer gebruiken).
- Tabellen (public): `customers`, `conversations` (status: open / wacht_op_klant / wacht_op_mens / gesloten), `messages`, `products`, `product_categories`, plus `quote_requests`, `quote_request_items`, `bookings`, `booking_items`, `contacts`.
- Meta: app "Sonilux Klantassistent" (App ID 950777317433094), testnummer Phone Number ID 1301054419764137, WABA ID 1269375775272377. Testontvanger: Andy's nummer.
- Secrets (alleen in Supabase, **nooit in code of git**): `GEMINI_API_KEY`, `GEMINI_MODEL`, `META_VERIFY_TOKEN`, `META_PHONE_NUMBER_ID`, `META_WHATSAPP_TOKEN`, `META_APP_SECRET`, `RIK_WHATSAPP_NUMBER` (ontvanger meldingen, voorlopig Andy's nummer), `RIK_TEMPLATE_AANVRAAG` / `RIK_TEMPLATE_OVERDRACHT` (namen van de goedgekeurde templates; zonder deze gaat er platte tekst, die alleen binnen 24 uur aankomt), `RIK_TEMPLATE_LANGUAGE` (standaard `nl`).
- Botnummer en Rik's nummer zijn **verschillend**: de bot praat met klanten op het botnummer, Rik krijgt meldingen op zijn eigen nummer. Berichten vanaf Rik's nummer negeert de bot.
- Tests: `deno test supabase/functions/whatsapp-webhook-meta/` (met `lib: deno.ns`; de root-tsconfig is voor Next.js).

## Eisen bot (v1)
- Alleen Nederlands, zakelijk-vriendelijk, korte berichten; zegt dat hij een digitale assistent is.
- Noemt **nooit** prijzen, kortingen, garanties of toezeggingen over levering/beschikbaarheid.
- Stelt alleen producten voor die op voorraad zijn (ja/nee; beschikbaarheid per datum checkt Rik).
- Vraagt door tot de aanvraag compleet is: naam, datum, locatie, aantal gasten, type event, gewenste producten. Vat samen en slaat de aanvraag op (status nieuw / geaccepteerd / aangepast).
- Stuurt per aanvraag een WhatsApp-melding naar Rik met samenvatting + productvoorstel.
- Overdracht bij: klant wil een mens, vraag over prijs/korting/garantie, of bot weet het niet → klant krijgt bericht dat Rik contact opneemt, gesprek krijgt vlag (`wacht_op_mens`) + reden, bot reageert daar niet meer, Rik krijgt een WhatsApp-melding. Rik ziet en beantwoordt het gesprek in het admin-scherm en kan het teruggeven aan de bot.
- Reageert alleen op klantberichten, stuurt zelf niets uit.

## Werkafspraken
- Eerst plan + akkoord vóór wijzigingen in Meta of de productie-database.
- Altijd eerst vragen bij onomkeerbare acties, publiceren of indienen.
- Betaalmethodes, wachtwoorden en API-keys vult Andy zelf in.
- Database-wijzigingen via migraties; geen productdata invullen zonder akkoord.
- Commit na elke afgeronde taak; korte status: klaar / wat Andy moet doen / volgende taak.
- Commitberichten in het Nederlands.
