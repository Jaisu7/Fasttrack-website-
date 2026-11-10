import type { Metadata } from 'next';
import { company, siteDescription, siteTitle } from '../src/lib/site-info.mjs';
import { createSiteMetadata } from '../scripts/site-metadata.mjs';
import './globals.css';
const origin = process.env.SITE_URL || 'https://fastrack-metallic-git-preview.alertmouse130.chatgpt.site';
const indexable = process.env.SITE_INDEXABLE === 'true';
const site = createSiteMetadata({ siteUrl: origin, indexable });
export const metadata: Metadata = {
  metadataBase: new URL(site.canonical), title: { default: siteTitle, template: '%s | Fastrack Metallic' }, description: siteDescription,
  robots: { index: indexable, follow: true }, alternates: { canonical: '/' }, icons: { icon: '/images/favicon.png' },
  openGraph: { title: siteTitle, description: siteDescription, type: 'website', locale: 'en_AE', siteName: company.name, url: '/', images: [{ url: '/images/hero.webp', width: 1536, height: 1024, alt: 'Fastrack Metallic stainless steel fabrication concept' }] },
  twitter: { card: 'summary_large_image', title: siteTitle, description: siteDescription, images: ['/images/hero.webp'] },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const schema = site.schema;
  return <html lang="en" data-theme="dark"><head><meta name="theme-color" content="#101619" /><link rel="preload" href="/fonts/manrope-600.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /><link rel="preload" href="/images/laser-bed.webp" as="image" fetchPriority="high" /></head><body>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} /></body></html>;
}
