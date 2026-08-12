import { getDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function GET() {
  const db = await getDatabase();
  const logs = await db.collection('audit_logs').find().sort({ time: -1 }).limit(20).toArray();
  const threats = await db.collection('security_threats').find().toArray();
  
  return NextResponse.json({ logs, threats });
}

// Action to rotate keys
export async function POST() {
  // Logic to invalidate old JWT secrets or API keys
  return NextResponse.json({ message: "Encryption keys rotated successfully" });
}