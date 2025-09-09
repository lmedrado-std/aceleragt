import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    await sql`SELECT 1`;
    return NextResponse.json({ status: 'connected' });
  } catch (error) {
    return NextResponse.json({ status: 'disconnected' });
  }
}
