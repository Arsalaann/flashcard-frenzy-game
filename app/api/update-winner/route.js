import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { matchId, winner } = await req.json();

    if (!matchId || !winner) {
      return NextResponse.json(
        { success: false, error: "matchId and winner are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("flashcard-frenzy-game"); 

    const result = await db.collection("lobbies").updateOne(
      { _id: matchId },
      { $set: { winner, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "No match found with given matchId" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, result });

  } catch (err) {
    console.error("Error updating winner:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}