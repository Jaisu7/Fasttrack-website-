import { env } from 'cloudflare:workers';
import { submitEnquiry } from '../../../server/enquiries.mjs';
export async function POST(request: Request) { return submitEnquiry(request, env); }
