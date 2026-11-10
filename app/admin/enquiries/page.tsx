import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';
import { isReviewer } from '../../../server/enquiries.mjs';
import Inbox from './inbox';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Team enquiry inbox', robots: { index: false, follow: false } };
export default async function EnquiriesPage() {
  const h = await headers();
  const request = new Request('https://fastrack.invalid/admin/enquiries', { headers: h });
  if (!isReviewer(request, env)) return <main className="information-page"><a className="text-link" href="/">← Fastrack Metallic</a><h1>Team access</h1><p>This inbox is restricted to authorised Fastrack reviewers.</p><a className="button button-green" target="_top" href="/signin-with-chatgpt?return_to=%2Fadmin%2Fenquiries">Sign in with ChatGPT</a><p>If you are already signed in, ask the website owner to enable your team access.</p></main>;
  return <Inbox />;
}
