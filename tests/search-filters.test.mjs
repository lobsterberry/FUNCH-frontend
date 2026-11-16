import test from "node:test";
import assert from "node:assert/strict";
import { countries, defaultCriteria, getSearchCities } from "../src/lib/rental.ts";

test("selects Hokkaido from a city or an airport search", () => {
  for (const location of ["ฮอกไกโด", "สนามบิน ฮอกไกโด", " ฮอกไกโด - สนามบิน "]) {
    assert.deepEqual(getSearchCities({ country: "JP", location }), ["ฮอกไกโด"]);
  }
});

test("selects the city for every country's default airport", () => {
  for (const country of countries) {
    assert.deepEqual(
      getSearchCities({ country: country.code, location: country.location }),
      [country.city],
    );
  }
});

test("uses the pickup city even when the return city differs", () => {
  assert.deepEqual(
    getSearchCities({
      ...defaultCriteria,
      location: "ฮอกไกโด",
      return_location: "โอซาก้า",
    }),
    ["ฮอกไกโด"],
  );
});

test("does not infer an unrelated city for unknown or unrestricted searches", () => {
  for (const criteria of [
    { country: "JP", location: "สนามบินที่ไม่รู้จัก" },
    { country: "JP", location: "" },
    { country: "TH", location: "ฮอกไกโด" },
    { country: "all", location: "โตเกียว" },
    { country: "unknown", location: "โตเกียว" },
  ]) {
    assert.deepEqual(getSearchCities(criteria), []);
  }
});
