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
  try {
    await connectToDatabase();
    const notes = await Note.find({}).lean();
    return NextResponse.json(notes);
  } catch (error) {
    console.error('GET /api/notes error:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

    if (rateLimit(ip, 10, 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    await connectToDatabase();

    const alreadyPosted = await Note.findOne({ ip });
    if (alreadyPosted) {
      return NextResponse.json(
        { error: 'You can only post 2 notes max.' },
        { status: 403 }
      );
    }

    const data = await req.json();
    const note = await Note.create({ ...data, ip });

    return NextResponse.json(note);
  } catch (error) {
    console.error('POST /api/notes error:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
