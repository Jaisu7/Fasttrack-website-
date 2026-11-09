import test from "node:test";
import assert from "node:assert/strict";
import { selectRenderQuality, frameIsDue } from "../src/lib/render-quality.mjs";
import { createSiteMetadata, previewOrigin } from "../scripts/site-metadata.mjs";
import { company } from "../src/lib/site-info.mjs";
import { createProjectItemId } from "../src/lib/project-list.mjs";

test("local project rows remain unique when randomUUID is unavailable on a non-HTTPS preview", () => {
  const ids = Array.from({ length: 100 }, () => createProjectItemId({}));
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every(id => typeof id === "string" && id.length <= 80));
  assert.equal(createProjectItemId({ randomUUID: () => "native-uuid" }), "native-uuid");
});

test("phones, low-memory devices and data-saving connections receive a bounded render budget", () => {
  for (const input of [{ width: 390 }, { width: 1440, coarsePointer: true }, { memory: 2 }, { cores: 4 }, { saveData: true }]) {
    const quality = selectRenderQuality({ pixelRatio: 3, ...input });
    assert.equal(quality.maxFps, 30);
    assert.equal(quality.shadowSize, 512);
    assert.equal(quality.pixelRatio, 1.25);
    assert.equal(quality.antialias, false);
  }
  const desktop = selectRenderQuality({ width: 1440, pixelRatio: 3, memory: 8, cores: 8 });
  assert.equal(desktop.maxFps, 60);
  assert.equal(desktop.shadowSize, 1024);
  assert.equal(desktop.pixelRatio, 1.5);
  assert.equal(selectRenderQuality({ pixelRatio: NaN }).pixelRatio, 1);
});

test("30 fps rendering skips alternate display frames without slowing animation time", () => {
  let previous = 0;
  const times = [];
  for (let tick = 1; tick <= 60; tick++) {
    const time = tick * 1000 / 60;
    if (frameIsDue(time, previous, 30)) { times.push(time); previous = time; }
  }
  assert.equal(times.length, 30);
  assert.ok(Math.abs(times.at(-1) - times[0] - 29 * 1000 / 30) < 0.01);
  assert.equal(frameIsDue(5000, 0, 30), true);
});

test("private-preview metadata cannot accidentally advertise a public search launch", () => {
  const metadata = createSiteMetadata();
  assert.equal(metadata.canonical, previewOrigin);
  assert.match(metadata.robots, /Disallow: \//);
  assert.equal(metadata.tags.find(t => t.attrs?.name === "robots").attrs.content, "noindex, follow");
});

test("a public build keeps its canonical, sitemap, share URLs and contact schema consistent", () => {
  const metadata = createSiteMetadata({ siteUrl: "https://fasttrackmi.com", indexable: true });
  assert.equal(metadata.canonical, "https://fasttrackmi.com/");
  assert.match(metadata.robots, /Sitemap: https:\/\/fasttrackmi.com\/sitemap.xml/);
  assert.match(metadata.sitemap, /<loc>https:\/\/fasttrackmi.com\/<\/loc>/);
  assert.equal(metadata.tags.find(t => t.attrs?.property === "og:url").attrs.content, metadata.canonical);
  const schema = JSON.parse(metadata.tags.find(t => t.attrs?.type === "application/ld+json").children);
  assert.equal(schema.telephone, company.telephone);
  assert.equal(schema.email, company.email);
  assert.equal(schema.url, metadata.canonical);
  assert.equal(schema.address.addressLocality, "Sharjah");
});

test("misconfigured canonical URLs fail the build rather than shipping credentials or tracking parameters", () => {
  for (const siteUrl of ["javascript:alert(1)", "https://user:secret@example.com/", "https://example.com/?token=test", "https://example.com/#products", "https://example.com/preview"]) {
    assert.throws(() => createSiteMetadata({ siteUrl }));
  }
});
