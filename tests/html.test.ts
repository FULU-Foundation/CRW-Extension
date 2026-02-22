import test from "node:test";
import assert from "node:assert/strict";

import { decodeEntityStrings, decodeHtmlEntities } from "../src/shared/html.ts";

test("decodeHtmlEntities decodes named and numeric entities", () => {
  const value =
    "Apple&#039;s anti-repair &amp; anti-refurbishment &quot;practices&quot;";
  const decoded = decodeHtmlEntities(value);

  assert.equal(decoded, `Apple's anti-repair & anti-refurbishment "practices"`);
});

test("decodeEntityStrings decodes nested object strings", () => {
  const input = {
    PageName: "AT&amp;T",
    Description: "User&#039;s example",
    nested: {
      label: "A &quot;quoted&quot; value",
    },
  };

  const decoded = decodeEntityStrings(input) as {
    PageName: string;
    Description: string;
    nested: { label: string };
  };

  assert.equal(decoded.PageName, "AT&T");
  assert.equal(decoded.Description, "User's example");
  assert.equal(decoded.nested.label, 'A "quoted" value');
});
