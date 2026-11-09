import { company, siteDescription, siteTitle } from "../src/lib/site-info.mjs";

export const previewOrigin = "https://fastrack-metallic-git-preview.alertmouse130.chatgpt.site/";

export function createSiteMetadata({ siteUrl = previewOrigin, indexable = false } = {}) {
  const url = new URL(siteUrl);
  if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("SITE_URL must be the public HTTP(S) site origin, without credentials, a path, query or fragment.");
  }
  const canonical = url.href;
  const image = new URL("images/hero.webp", canonical).href;
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${canonical}#business`,
    name: company.name,
    url: canonical,
    description: siteDescription,
    logo: new URL("images/brand-mark.svg", canonical).href,
    telephone: company.telephone,
    email: company.email,
    address: { "@type": "PostalAddress", addressLocality: "Sharjah", addressRegion: "Sharjah", addressCountry: "AE" },
  };
  const meta = (name, content, property = false) => ({ tag: "meta", attrs: { [property ? "property" : "name"]: name, content } });
  return {
    canonical,
    tags: [
      { tag: "title", children: siteTitle },
      meta("description", siteDescription),
      meta("robots", indexable ? "index, follow, max-image-preview:large" : "noindex, follow"),
      { tag: "link", attrs: { rel: "canonical", href: canonical } },
      meta("og:title", siteTitle, true), meta("og:description", siteDescription, true),
      meta("og:type", "website", true), meta("og:site_name", company.name, true),
      meta("og:url", canonical, true), meta("og:locale", "en_AE", true),
      meta("og:image", image, true), meta("og:image:width", "1536", true), meta("og:image:height", "1024", true),
      meta("og:image:alt", "Fastrack Metallic stainless steel fabrication concept", true),
      meta("twitter:card", "summary_large_image"), meta("twitter:title", siteTitle),
      meta("twitter:description", siteDescription), meta("twitter:image", image),
      { tag: "script", attrs: { type: "application/ld+json" }, children: JSON.stringify(schema).replace(/</g, "\\u003c") },
    ],
    robots: indexable ? `User-agent: *\nAllow: /\n\nSitemap: ${canonical}sitemap.xml\n` : "User-agent: *\nDisallow: /\n",
    sitemap: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${canonical}</loc></url></urlset>\n`,
  };
}

export function siteMetadataPlugin(options) {
  const metadata = createSiteMetadata(options);
  return {
    name: "fastrack-site-metadata",
    transformIndexHtml() { return metadata.tags; },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "robots.txt", source: metadata.robots });
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: metadata.sitemap });
    },
  };
}
