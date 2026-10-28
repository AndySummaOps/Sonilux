import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { handoverParams, handoverText, requestParams, requestText } from "./notify.ts";
import { templateParam } from "../_shared/whatsapp.ts";

Deno.test("aanvraag: alle velden in de melding", () => {
  const params = requestParams("+31612345678", {
    name: "Sanne de Vries",
    event_date: "2026-12-12",
    location: "Venlo",
    guests: 80,
    event_type: "bruiloft",
    products: ["LED Kubus", "Statafel Rond"],
  });
  assertEquals(params[0], "Sanne de Vries");
  assertEquals(params[2], "zaterdag 12 december 2026");
  assertEquals(params[6], "LED Kubus, Statafel Rond");
  assertStringIncludes(requestText(params), "Gasten: 80");
});

Deno.test("aanvraag: ontbrekende velden worden een streepje", () => {
  const params = requestParams("+31612345678", {
    name: null,
    event_date: null,
    location: null,
    guests: null,
    event_type: null,
    products: [],
  });
  assertEquals(params, ["-", "+31612345678", "-", "-", "-", "-", "-"]);
});

Deno.test("overdracht: reden leesbaar en lang bericht ingekort", () => {
  const params = handoverParams("Piet", "+31600000000", "prijs_korting_garantie", "x".repeat(500));
  assertEquals(params[2], "vraag over prijs, korting of garantie");
  assertEquals(params[3].length, 300);
  assertStringIncludes(handoverText(params), "Klant: Piet");
});

Deno.test("templateparameter: geen enters, tabs of lege waarde", () => {
  assertEquals(templateParam("Hoi\n\nwat\tkost    dit?"), "Hoi wat kost dit?");
  assertEquals(templateParam("   "), "-");
});
