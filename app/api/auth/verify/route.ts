import { NextResponse } from 'next/server';
import { validateJoinCode, unlockYearSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const { year, joinCode } = await request.json();
    const yearNumber = parseInt(year, 10);

    if (isNaN(yearNumber) || !joinCode) {
      return NextResponse.json(
        { success: false, error: 'Year and join code required' },
        { status: 400 }
      );
    }

    const isValid = await validateJoinCode(yearNumber, joinCode);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid join code' },
        { status: 401 }
      );
    }

    await unlockYearSession(yearNumber);
    return NextResponse.json({ success: true });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
