export const UPLOAD_LIMIT = 6 * 1024 * 1024;
const FILE_TYPES = new Set(['pdf', 'dxf', 'dwg', 'png', 'jpg', 'jpeg']);
const STATUSES = new Set(['new', 'reviewing', 'responded', 'archived']);
const json = (body, status = 200, headers = {}) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
const clean = (value, max) => String(value ?? '').replace(/\0/g, '').trim().slice(0, max);
export function isReviewer(request, env) {
  const id = request.headers.get('oai-authenticated-user-id');
  const email = request.headers.get('oai-authenticated-user-email')?.toLowerCase().trim();
  const reviewers = String(env.ENQUIRY_REVIEWERS ?? '').toLowerCase().split(',').map(v => v.trim()).filter(Boolean);
  return Boolean(id && email && reviewers.includes(email));
}
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return request.headers.get('sec-fetch-site') !== 'cross-site';
  return origin === new URL(request.url).origin;
}
export function validateFields(form) {
  const fields = { name: clean(form.get('name'), 120), email: clean(form.get('email'), 200), phone: clean(form.get('phone'), 40), company: clean(form.get('company'), 160), requirement: clean(form.get('requirement'), 200), details: clean(form.get('details'), 30000) };
  if (clean(form.get('website'), 100)) return { error: 'This request could not be processed.' };
  if (fields.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) || !fields.requirement || fields.details.length < 15 || !['on', 'true'].includes(String(form.get('consent')))) return { error: 'Please check your name, email, requirement, project details and consent.' };
  const files = form.getAll('drawings').filter(file => typeof file !== 'string' && file.size > 0);
  if (files.length > 2) return { error: 'Attach up to two files.' };
  for (const file of files) {
    if (file.size > UPLOAD_LIMIT) return { error: 'Each attachment must be 6 MB or smaller.' };
    if (!FILE_TYPES.has(file.name.split('.').pop()?.toLowerCase())) return { error: 'Use PDF, DXF, DWG, PNG or JPG attachments.' };
  }
  return { fields, files };
}
async function requestKey(request) {
  const window = Math.floor(Date.now() / (15 * 60 * 1000));
  const visitor = request.headers.get('cf-connecting-ip') || request.headers.get('oai-authenticated-user-id') || 'unidentified';
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${window}:${visitor}`));
  return { key: [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join(''), window };
}
async function boundedForm(request) {
  if (!request.body) throw new TypeError('Missing form');
  const reader = request.body.getReader(), chunks = [];
  let total = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > 13 * 1024 * 1024) { await reader.cancel(); throw new RangeError('Request too large'); }
    chunks.push(value);
  }
  return new Response(new Blob(chunks), { headers: { 'Content-Type': request.headers.get('content-type') || '' } }).formData();
}
export async function submitEnquiry(request, env) {
  if (!sameOrigin(request)) return json({ error: 'Submit this enquiry from the Fastrack website.' }, 403);
  if (!env.DB) return json({ error: 'Enquiry submission is temporarily unavailable. Please call or email the team.' }, 503);
  if (Number(request.headers.get('content-length')) > 13 * 1024 * 1024) return json({ error: 'The request is too large. Attach up to two files, 6 MB each.' }, 413);
  const token = request.headers.get('idempotency-key') ?? '';
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(token)) return json({ error: 'Refresh the form and try again.' }, 400);
  const uploaded = [];
  try {
    const result = validateFields(await boundedForm(request));
    if (result.error) return json({ error: result.error }, 400);
    const previous = await env.DB.prepare('SELECT reference FROM enquiries WHERE idempotency_key = ?').bind(token).first();
    if (previous) return json({ reference: previous.reference, received: true });
    const rate = await requestKey(request);
    const count = await env.DB.prepare('INSERT INTO enquiry_rate_limits (key, window_start, count) VALUES (?, ?, 1) ON CONFLICT(key) DO UPDATE SET count = count + 1 RETURNING count').bind(rate.key, rate.window).first();
    if (count.count > 5) return json({ error: 'Too many requests. Please wait 15 minutes or contact the team directly.' }, 429, { 'Retry-After': '900' });
    await env.DB.prepare('DELETE FROM enquiry_rate_limits WHERE window_start < ?').bind(rate.window - 4).run();
    if (result.files.length && !env.BUCKET) return json({ error: 'Attachments are temporarily unavailable. Remove the files to submit, or contact the team.' }, 503);
    const id = crypto.randomUUID(), created = new Date().toISOString();
    const reference = `FT-${created.slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const files = [];
    for (const file of result.files) {
      const fileId = crypto.randomUUID();
      const filename = clean(file.name, 160).replace(/[^a-zA-Z0-9._ -]/g, '_');
      const key = `enquiries/${id}/${fileId}/${filename}`;
      await env.BUCKET.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: 'application/octet-stream' } });
      uploaded.push(key); files.push({ id: fileId, filename, key, size: file.size });
    }
    const { fields } = result;
    const statements = [env.DB.prepare('INSERT INTO enquiries (id, reference, idempotency_key, created_at, name, email, phone, company, requirement, details, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, reference, token, created, fields.name, fields.email, fields.phone, fields.company, fields.requirement, fields.details, 'new')];
    for (const file of files) statements.push(env.DB.prepare('INSERT INTO enquiry_files (id, enquiry_id, filename, object_key, size) VALUES (?, ?, ?, ?, ?)').bind(file.id, id, file.filename, file.key, file.size));
    await env.DB.batch(statements);
    return json({ reference, received: true, attachments: files.length }, 201);
  } catch (error) {
    if (uploaded.length && env.BUCKET) await env.BUCKET.delete(uploaded).catch(() => {});
    try { const previous = await env.DB.prepare('SELECT reference FROM enquiries WHERE idempotency_key = ?').bind(token).first(); if (previous) return json({ reference: previous.reference, received: true }); } catch {}
    if (error instanceof RangeError) return json({ error: 'The request is too large. Attach up to two files, 6 MB each.' }, 413);
    if (error instanceof TypeError) return json({ error: 'The form could not be read. Please review your files and try again.' }, 400);
    return json({ error: 'Your enquiry could not be saved. Your details remain in the form. Try again, call or email the team.' }, 503);
  }
}
export async function listEnquiries(request, env) {
  if (!isReviewer(request, env)) return json({ error: 'Team access is required.' }, 403);
  const url = new URL(request.url), status = url.searchParams.get('status'), before = url.searchParams.get('before');
  const filters = [], args = [];
  if (STATUSES.has(status)) { filters.push('status = ?'); args.push(status); }
  if (before) {
    const [time,id] = before.split('|');
    if (!/^\d{4}-\d\d-\d\dT[0-9:.]+Z$/.test(time) || !/^[a-f0-9-]{36}$/.test(id || '')) return json({ error: 'Invalid page reference.' }, 400);
    filters.push('(created_at < ? OR (created_at = ? AND id < ?))'); args.push(time,time,id);
  }
  try {
    const { results } = await env.DB.prepare(`SELECT * FROM enquiries${filters.length ? ` WHERE ${filters.join(' AND ')}` : ''} ORDER BY created_at DESC, id DESC LIMIT 31`).bind(...args).all();
    const items = results.slice(0, 30);
    const files = items.length ? (await env.DB.prepare(`SELECT id, enquiry_id, filename, size FROM enquiry_files WHERE enquiry_id IN (${items.map(() => '?').join(',')})`).bind(...items.map(item => item.id)).all()).results : [];
    for (const item of items) { delete item.idempotency_key; item.files = files.filter(file => file.enquiry_id === item.id).map(({enquiry_id,...file}) => file); }
    return json({ items, next: results.length > 30 ? `${items.at(-1).created_at}|${items.at(-1).id}` : null });
  } catch { return json({ error: 'The enquiry inbox is temporarily unavailable.' }, 503); }
}
export async function updateEnquiry(request, env, id) {
  if (!isReviewer(request, env)) return json({ error: 'Team access is required.' }, 403);
  if (!sameOrigin(request)) return json({ error: 'Use the Fastrack team inbox.' }, 403);
  let data; try { data = await request.json(); } catch { return json({ error: 'Invalid update.' }, 400); }
  if (!STATUSES.has(data.status)) return json({ error: 'Choose a valid enquiry status.' }, 400);
  const result = await env.DB.prepare('UPDATE enquiries SET status = ? WHERE id = ? RETURNING id, status').bind(data.status, id).first();
  return result ? json(result) : json({ error: 'Enquiry not found.' }, 404);
}
export async function downloadEnquiryFile(request, env, id, fileId) {
  if (!isReviewer(request, env)) return json({ error: 'Team access is required.' }, 403);
  const file = await env.DB.prepare('SELECT filename, object_key FROM enquiry_files WHERE id = ? AND enquiry_id = ?').bind(fileId, id).first();
  if (!file || !env.BUCKET) return json({ error: 'File not found.' }, 404);
  const object = await env.BUCKET.get(file.object_key);
  if (!object) return json({ error: 'File not found.' }, 404);
  return new Response(object.body, { headers: { 'Cache-Control': 'private, no-store', 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="${file.filename.replace(/["\r\n]/g, '_')}"`, 'X-Content-Type-Options': 'nosniff' } });
}
