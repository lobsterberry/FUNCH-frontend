import test from "node:test";
import assert from "node:assert/strict";
import { getCountry, getSearchCities } from "../src/lib/rental.ts";

// Master data is loaded from the API; provide it explicitly in unit tests.
const countries = [
  { code: "JP", city: "โตเกียว", cities: ["โตเกียว", "โอซาก้า", "ฮอกไกโด"], location: "โตเกียว - สนามบินฮาเนดะ" },
  { code: "TH", city: "กรุงเทพ", cities: ["กรุงเทพ", "เชียงใหม่"], location: "กรุงเทพ - สนามบินสุวรรณภูมิ" },
];

test("selects Hokkaido from a city or an airport search", () => {
  for (const location of ["ฮอกไกโด", "สนามบิน ฮอกไกโด", " ฮอกไกโด - สนามบิน "]) {
    assert.deepEqual(getSearchCities({ country: "JP", location }, countries), ["ฮอกไกโด"]);
  }
});

test("selects the city for every country's default airport", () => {
  for (const country of countries) {
    assert.deepEqual(
      getSearchCities({ country: country.code, location: country.location }, countries),
      [country.city],
    );
  }
});

test("uses the pickup city even when the return city differs", () => {
  assert.deepEqual(
    getSearchCities({
      country: "JP",
      location: "ฮอกไกโด",
      return_location: "โอซาก้า",
    }, countries),
    ["ฮอกไกโด"],
  );
});

test("country lookup returns only the requested API record", () => {
  assert.equal(getCountry("TH", countries), countries[1]);
  assert.equal(getCountry("all", countries), undefined);
  assert.equal(getCountry("DE", countries), undefined);
  assert.equal(getCountry("TH", []), undefined);
});

test("does not infer an unrelated city for unknown or unrestricted searches", () => {
  for (const criteria of [
    { country: "JP", location: "สนามบินที่ไม่รู้จัก" },
    { country: "JP", location: "" },
    { country: "TH", location: "ฮอกไกโด" },
    { country: "all", location: "โตเกียว" },
    { country: "unknown", location: "โตเกียว" },
  ]) {
    assert.deepEqual(getSearchCities(criteria, countries), []);
  }
});
