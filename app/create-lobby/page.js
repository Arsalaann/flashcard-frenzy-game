"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";
import styles from "./page.module.css";
import styles1 from "../page.module.css";

export default function CreateLobby() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [matchId, setMatchId] = useState(null);
  const [secondPlayer, setSecondPlayer] = useState("Waiting for player 2");
  const [isCreatingLobby, setIsCreatingLobby] = useState(true);
  const [prompt, setPrompt] = useState("Creating Lobby...");
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    let waitingInterval;

    if (countdown === null) {
      waitingInterval = setInterval(() => {
        setSecondPlayer((prev) => {
          if (prev === "Waiting for player 2") return "Waiting for player 2.";
          if (prev === "Waiting for player 2.") return "Waiting for player 2..";
          if (prev === "Waiting for player 2..") return "Waiting for player 2...";
          return "Waiting for player 2";
        });
      }, 500);
    }
    return () => clearInterval(waitingInterval);
  }, [countdown]);

  useEffect(() => {
    const fetchUserAndCreateLobby = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        router.replace("/login");
        return;
      }

      const userEmail = data.session.user.email;
      setUser(data.session.user);

      let newMatchId;
      let success = false;

      while (!success) {
        newMatchId = "match_" + Math.floor(Math.random() * 10000);
        try {
          const res = await fetch("/api/create-lobby", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matchId: newMatchId, playerEmail: userEmail }),
          });

          const result = await res.json();
          if (result.success) {
            success = true;
            setIsCreatingLobby(false);
            setMatchId(newMatchId);
          } else if (result.reason === "duplicate") {
            continue;
          } else {
            console.error("Lobby creation failed:", result);
            break;
          }
        } catch {
          setPrompt("Check your internet connection");
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    };

    fetchUserAndCreateLobby();
  }, [router]);

  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (!matchId || window.location.pathname.includes("/game")) return;
      try {
        await fetch("/api/delete-lobby", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId }),
        });
      } catch (err) {
        console.error("Error deleting lobby on leave:", err);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;

    const channel = supabase.channel(`lobby:${matchId}`, {
      config: {
        broadcast: { self: true },
      },
    })

    let interval;
    channel.on("broadcast", { event: "start_match" }, ({ payload }) => {
      const { matchId, secondPlayer } = payload;
      console.log("Match start signal received:", matchId);

      let count = 3;
      setCountdown(count);
      setSecondPlayer(secondPlayer);

      interval = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(interval);
          router.push(`/game/${matchId}`);
        } else {
          setCountdown(count);
        }
      }, 1000);
    });

    channel.subscribe((status) => {
      console.log("CreateLobby channel status:", status, "matchId:", matchId);
    });

    return () => {
      clearInterval(interval);
    };
  }, [matchId, router]);

  return isCreatingLobby ? (
    <div className={styles.page}>{prompt}</div>
  ) : (
    <div className={styles.page}>
      <Link href="/" className={styles1.backButton}>
        ←
      </Link>
      <div className={styles.screenLeaveWarning}>Do not leave the screen otherwise lobby will be deleted</div>
      <h1 className={styles.title}>Create Lobby</h1>
      {matchId && user && (
        <>
          <div className={styles.lobbyBox}>
            <strong>Lobby ID</strong>
            <p className={styles.matchId}>{matchId}</p>
            <p>{user.email}</p>
            <strong>VS</strong>
            <p className={countdown ? "" : styles.isWaiting}>{secondPlayer}</p>
          </div>
          {countdown && (
            <div className={styles1.countdownBox}>
              <h2>Game starts in: {countdown}</h2>
            </div>
          )}
        </>
      )}
    </div>
  );
}