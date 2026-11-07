import test from "node:test";
import assert from "node:assert/strict";
import { prepareEnquiry } from "../src/lib/enquiry.mjs";
test("enquiry handoff preserves special characters and targets only the company address", () => {
  const draft = prepareEnquiry({
    name: "Review Person",
    email: "qa@example.com",
    company: "A&B",
    requirement: "Sinks & wash stations",
    details: "Line one\nA + B = 50%",
  });
  const url = new URL(draft.mailto);
  assert.equal(url.pathname, "info@fasttrackmi.com");
  assert.equal(url.searchParams.get("subject"), draft.subject);
  assert.equal(url.searchParams.get("body"), draft.body);
  assert.ok(draft.body.includes("Line one\nA + B = 50%"));
});
