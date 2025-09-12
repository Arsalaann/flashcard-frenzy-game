"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";
import styles from "./page.module.css";
import styles1 from "../page.module.css";

export default function JoinLobby() {
    const router = useRouter();
    const [matchInfo, setMatchInfo] = useState(null);
    const [status, setStatus] = useState("Searching lobby...");
    const [countdown, setCountdown] = useState(null);

    let interval;
    const startCountdown = () => {
        let count = 3;
        setCountdown(count);

        interval = setInterval(() => {
            count -= 1;
            if (count > 0) {
                setCountdown(count);
            } else {
                clearInterval(interval);
                router.push(`/game/${matchInfo.matchId}`);
            }
        }, 1000);
    };

    useEffect(() => {
        if (!matchInfo?.matchId) return;

        const channel = supabase.channel(`lobby:${matchInfo.matchId}`, {
            config: {
                broadcast: { self: true },
            },
        })

        channel.on("broadcast", { event: "start_match" }, (payload) => {
            console.log("Match start signal received:", payload.matchId);
            startCountdown();
        });

        channel.subscribe(async (status) => {
            if (status === "SUBSCRIBED" && matchInfo.isInitiator) {
                await channel.send({
                    type: "broadcast",
                    event: "start_match",
                    payload: { matchId: matchInfo.matchId, secondPlayer: matchInfo.player2 },
                });
            }
        });

        return () => {
            clearInterval(interval);
        };
    }, [matchInfo]);



    useEffect(() => {
        const fetchUserAndJoinLobby = async () => {
            const { data, error } = await supabase.auth.getSession();
            if (error || !data.session) {
                router.replace("/login");
                return;
            }

            const userEmail = data.session.user.email;

            try {
                const res = await fetch("/api/join-lobby", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ playerEmail: userEmail }),
                });

                const result = await res.json();

                if (result.success) {
                    setMatchInfo(result);
                    setStatus("Joined successfully!");
                } else {
                    setStatus(result.message || "No Open lobby Found");
                }
            } catch (err) {
                console.error("Error joining lobby:", err);
                setStatus("Check Your internet Connection");
            }
        };

        fetchUserAndJoinLobby();
    }, [router]);

    return (
        <div className={styles.page}>
            <Link href="/" className={styles1.backButton}>←</Link>
            <h1 className={styles.title}>Join Lobby</h1>

            {!matchInfo ? (
                <p className={styles.lobbyBox}>{status}</p>
            ) : (
                <>
                    <div className={styles.lobbyBox}>
                        <strong>Lobby ID</strong>
                        <p className={styles.matchId}>{matchInfo.matchId}</p>
                        <p>{matchInfo.player1}</p>
                        <strong>VS</strong>
                        <p>{matchInfo.player2}</p>
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