import { assertEquals } from "jsr:@std/assert@1";
import { detectInboundHandover, detectOutboundViolation, ensureIntro, toWhatsappFormatting } from "./guards.ts";
import { parseBotTurn } from "./gemini.ts";

Deno.test("inbound: vraag om een mens", () => {
  for (const text of ["Kan ik iemand spreken?", "Ik wil graag een medewerker", "Kan Rick me bellen?", "Bel me even terug aub"]) {
    assertEquals(detectInboundHandover(text), "klant_wil_mens", text);
  }
});

Deno.test("inbound: prijs, korting, garantie", () => {
  for (const text of ["Wat kost de LED-bar?", "Wat zijn de prijzen?", "Krijg ik korting bij 2 stuks?", "Zit er garantie op?", "Is €200 genoeg?"]) {
    assertEquals(detectInboundHandover(text), "prijs_korting_garantie", text);
  }
});

Deno.test("inbound: gewone vragen geven geen overdracht", () => {
  for (const text of [
    "Hoi, ik zoek een LED-bar voor een bruiloft met 50 personen",
    "Wat is het verschil tussen de statafels?",
    "Hoeveel mensen passen er aan een statafel?",
    "We zijn met 80 man, per persoon een plekje",
    "Kunnen jullie ook een offerte maken?",
  ]) {
    assertEquals(detectInboundHandover(text), null, text);
  }
});

Deno.test("outbound: bedragen en beloftes worden tegengehouden", () => {
  assertEquals(detectOutboundViolation("De bar kost €150 per dag."), "prijs_korting_garantie");
  assertEquals(detectOutboundViolation("Je krijgt 10% korting!"), "prijs_korting_garantie");
  assertEquals(detectOutboundViolation("Die datum is nog vrij."), "weet_het_niet");
  assertEquals(detectOutboundViolation("We leveren zaterdagochtend."), "weet_het_niet");
  assertEquals(detectOutboundViolation("Ik zet een voorlopige reservering klaar."), "weet_het_niet");
});

Deno.test("outbound: normaal antwoord mag door", () => {
  assertEquals(
    detectOutboundViolation("Voor een bruiloft past de *Snackbar* mooi. Op welke datum is het feest?"),
    null,
  );
  assertEquals(detectOutboundViolation("Rick bekijkt je aanvraag en neemt contact met je op."), null);
});

Deno.test("WhatsApp-opmaak", () => {
  assertEquals(toWhatsappFormatting("**Snackbar**: top"), "*Snackbar*: top");
  assertEquals(toWhatsappFormatting("Opties:\n* Snackbar\n* Ice Cube"), "Opties:\n- Snackbar\n- Ice Cube");
  assertEquals(toWhatsappFormatting("## Kop\ntekst"), "Kop\ntekst");
});

Deno.test("eerste antwoord noemt digitale assistent", () => {
  assertEquals(ensureIntro("Waarmee kan ik helpen?", true), "Hoi! Ik ben de digitale assistent van Sonilux. Waarmee kan ik helpen?");
  assertEquals(ensureIntro("Hoi, ik ben de digitale assistent van Sonilux.", true), "Hoi, ik ben de digitale assistent van Sonilux.");
  assertEquals(ensureIntro("Op welke datum?", false), "Op welke datum?");
});

Deno.test("parseBotTurn vult ontbrekende velden veilig in", () => {
  const turn = parseBotTurn(JSON.stringify({ reply: " Hoi ", handover_reason: "onzin", request: { guests: "veel" } }));
  assertEquals(turn.reply, "Hoi");
  assertEquals(turn.handover, false);
  assertEquals(turn.handover_reason, null);
  assertEquals(turn.request.guests, null);
  assertEquals(turn.request.products, []);
  assertEquals(turn.customer_confirmed, false);
});
