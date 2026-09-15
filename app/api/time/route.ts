import { NextResponse } from "next/server";

// Returns the server's own clock reading so clients can sync a trusted time
// offset for automatic quiz scheduling instead of relying on a student's
// (spoofable) device clock. See lib/serverTime.ts.
export async function GET() {
  return NextResponse.json(
    { now: Date.now() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
