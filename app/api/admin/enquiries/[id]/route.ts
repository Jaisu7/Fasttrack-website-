import { env } from 'cloudflare:workers';
import { updateEnquiry } from '../../../../../server/enquiries.mjs';
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { return updateEnquiry(request, env, (await params).id); }
