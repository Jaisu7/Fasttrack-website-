import test from "node:test";
import assert from "node:assert/strict";
import { composeEnquiryDetails, prepareEnquiry } from "../src/lib/enquiry.mjs";
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
test('quotation handoff includes customer notes with each new selected specification', () => {
  const notes = 'Access through a 900 mm doorway.\nDeliver to the first floor.';
  for (const specification of ['Table: 1234 × 700 × 900 mm', 'Rack: 1200 × 450 × 1800 mm']) {
    const details = composeEnquiryDetails(notes, specification);
    const draft = prepareEnquiry({ details });
    assert.ok(details.includes(notes));
    assert.ok(details.includes(specification));
    assert.ok(draft.body.includes(notes));
    assert.ok(draft.body.includes(specification));
  }
  assert.equal(composeEnquiryDetails(notes), notes);
  assert.ok(composeEnquiryDetails('', 'Table: 1234 × 700 × 900 mm').includes('1234 × 700 × 900 mm'));
});
