import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req) {
  try {
    const body = await req.json(); 
    const { matchId } = body;
    if (!matchId) return NextResponse.json({ error: "No matchId provided" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("flashcard-frenzy-game");
    const lobbies = db.collection("lobbies");

    await lobbies.deleteOne({ _id: matchId, status: "pending" });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("MongoDB delete lobby error:", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
