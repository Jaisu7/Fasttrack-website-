import { env } from 'cloudflare:workers';
import { downloadEnquiryFile } from '../../../../../../../server/enquiries.mjs';
export async function GET(request: Request, { params }: { params: Promise<{ id: string; fileId: string }> }) { const p = await params; return downloadEnquiryFile(request, env, p.id, p.fileId); }
