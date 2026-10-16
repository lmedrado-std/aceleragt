import { NextRequest } from 'next/server';

export const TEST_DB = process.env.TEST_DATABASE_URL;

/** Trava de segurança: os testes de integração apagam dados e nunca podem tocar o Neon. */
export function assertDisposableDatabase() {
  if (!TEST_DB) return;
  if (/neon\.tech|amazonaws|supabase|render\.com/i.test(TEST_DB)) {
    throw new Error('TEST_DATABASE_URL aponta para um banco remoto. Use apenas um Postgres local descartável.');
  }
  process.env.DATABASE_URL = TEST_DB;
}

export function jsonRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
}

export async function call(handler: (req: NextRequest) => Promise<Response>, req: NextRequest) {
  const res = await handler(req);
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json };
}
