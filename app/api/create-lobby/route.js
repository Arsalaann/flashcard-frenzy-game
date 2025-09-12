import clientPromise from "@/lib/mongodb";

export async function POST(req) {
  try {
    const { matchId, playerEmail } = await req.json();

    const client = await clientPromise;
    const db = client.db("flashcard-frenzy-game");
    const lobbies = db.collection("lobbies");

    await lobbies.insertOne({
      _id: matchId,
      player1: playerEmail,
      player2: null,
      winner: null,
      status: "pending",
      createdAt: new Date(),
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    if (err.code === 11000) {
      return new Response(
        JSON.stringify({ success: false, reason: "duplicate" }),
        { status: 400 }
      );
    }

    console.error("MongoDB create lobby error:", err);
    return new Response(JSON.stringify({ error: "DB error" }), { status: 500 });
  }
}
