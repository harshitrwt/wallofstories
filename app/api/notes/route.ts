import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/utils/connectDb';
import mongoose, { Model } from 'mongoose';
import { rateLimit } from '@/lib/ratelimit';


interface INote {
  id: string;
  content: string;
  position?: {
    x?: number;
    y?: number;
    z?: number;
  };
  wall: string;
  color: string;
  createdAt?: Date;
  updatedAt?: Date;
  ip: string;
}

const NoteSchema = new mongoose.Schema({
  id: { type: String, required: true },
  content: { type: String, required: true },
  position: {
    x: Number,
    y: Number,
    z: Number,
  },
  wall: { type: String, required: true },
  color: { type: String, required: true },
  ip: { type: String, required: true },
}, { timestamps: true });

const Note = (mongoose.models.Note as Model<INote>) || mongoose.model<INote>('Note', NoteSchema);

export async function GET() {
  await connectToDatabase();
  const notes = await Note.find({}).lean();
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (rateLimit(ip, 10, 60 * 1000)) { // 10 requests per minute
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  await connectToDatabase();
  const alreadyPosted = await Note.findOne({ ip });
  if (alreadyPosted) {
    return NextResponse.json({ error: 'You can only post one note.' }, { status: 403 });
  }
  const data = await req.json();
  const note = await Note.create({ ...data, ip });
  return NextResponse.json(note);
} 