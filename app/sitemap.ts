import { servicePages } from '../src/lib/service-content.mjs';
import { products } from '../src/lib/fasttrack-data';
export default function sitemap(){const origin=process.env.SITE_URL||'https://fastrack-metallic-git-preview.alertmouse130.chatgpt.site';return ['/', '/privacy', ...servicePages.map(s=>`/services/${s.id}`), ...products.map(p=>`/equipment/${p.id}`)].map(path=>({url:`${origin}${path}`}));}
