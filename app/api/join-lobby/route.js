import clientPromise from "@/lib/mongodb";

export async function POST(req) {
  try {
    const { playerEmail } = await req.json();

    const client = await clientPromise;
    const db = client.db("flashcard-frenzy-game");
    const lobbies = db.collection("lobbies");

    const pendingLobby = await lobbies.findOne({ status: "pending" });

    if (!pendingLobby) {
      return new Response(
        JSON.stringify({ success: false, message: "No pending lobbies" }),
        { status: 404 }
      );
    }

    await lobbies.updateOne(
      { _id: pendingLobby._id },
      {
        $set: {
          player2: playerEmail,
          status: "finished",
        },
      }
    );

    return new Response(
      JSON.stringify({
        success: true,
        matchId: pendingLobby._id,
        player1: pendingLobby.player1,
        player2: playerEmail,
        isInitiator: true,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("MongoDB join lobby error:", err);
    return new Response(JSON.stringify({ error: "DB error" }), { status: 500 });
  }
}
