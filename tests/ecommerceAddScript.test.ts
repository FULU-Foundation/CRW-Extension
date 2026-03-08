import test from "node:test";
import assert from "node:assert/strict";

import {
  applyEcommerceConfigUpdate,
  runEcommerceAdd,
} from "../scripts/lib/ecommerce-add.ts";

const fixtureConfig = (): string => {
  return JSON.stringify(
    {
      enableSubdomainMatching: true,
      enableMatchAcrossTLDs: true,
      marketplaceBrandDenylist: ["amazon", "ebay"],
      ecommerceDomainFamilyMap: {
        "amazon.com": "amazon",
        "ebay.com": "ebay",
      },
    },
    null,
    2,
  );
};

test("applyEcommerceConfigUpdate adds family domains and denylist entry", () => {
  const result = applyEcommerceConfigUpdate(fixtureConfig(), "arukereso", [
    "arukereso.hu",
    "arukereso.ro",
  ]);

  assert.equal(result.changed, true);
  assert.deepEqual(result.addedDomains, ["arukereso.hu", "arukereso.ro"]);
  assert.equal(result.addedToDenylist, true);
  assert.match(result.updatedSource, /"arukereso",/);
  assert.match(result.updatedSource, /"arukereso\.hu": "arukereso",/);
  assert.match(result.updatedSource, /"arukereso\.ro": "arukereso",/);
});

test("applyEcommerceConfigUpdate is idempotent when rerun", () => {
  const once = applyEcommerceConfigUpdate(fixtureConfig(), "arukereso", [
    "arukereso.hu",
  ]);
  const twice = applyEcommerceConfigUpdate(once.updatedSource, "arukereso", [
    "arukereso.hu",
  ]);

  assert.equal(once.changed, true);
  assert.equal(twice.changed, false);
  assert.deepEqual(twice.addedDomains, []);
  assert.equal(twice.addedToDenylist, false);
  assert.equal(twice.updatedSource, once.updatedSource);
});

test("runEcommerceAdd dry-run does not write files", async () => {
  let wrote = false;
  const source = fixtureConfig();

  const result = await runEcommerceAdd({
    family: "arukereso",
    domains: ["arukereso.hu"],
    dryRun: true,
    readSource: async () => source,
    writeSource: async () => {
      wrote = true;
    },
  });

  assert.equal(result.changed, true);
  assert.equal(wrote, false);
});

test("applyEcommerceConfigUpdate rejects domain family conflicts", () => {
  assert.throws(
    () =>
      applyEcommerceConfigUpdate(fixtureConfig(), "arukereso", ["amazon.com"]),
    /already mapped to family "amazon"/,
  );
});

test("applyEcommerceConfigUpdate emits valid JSON data output", () => {
  const result = applyEcommerceConfigUpdate(fixtureConfig(), "arukereso", [
    "arukereso.hu",
  ]);

  assert.equal(result.changed, true);
  assert.match(result.updatedSource, /"arukereso\.hu": "arukereso",/);
  assert.match(result.updatedSource, /"enableSubdomainMatching": true/);
});
