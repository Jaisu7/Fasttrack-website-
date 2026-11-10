import { env } from 'cloudflare:workers';
import { listEnquiries } from '../../../../server/enquiries.mjs';
export async function GET(request: Request) { return listEnquiries(request, env); }
