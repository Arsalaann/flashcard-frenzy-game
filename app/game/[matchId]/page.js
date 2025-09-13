"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useParams } from "next/navigation";
import GameOver from './GameOver';
import styles from "./page.module.css";

let interval;
// Hardcoded questions
const questions = [
    { id: 1, question: "What is the capital of France?", options: ["Paris", "Rome", "Madrid", "Berlin"], answer: "Paris" },
    { id: 2, question: "2 + 2 = ?", options: ["3", "4", "5", "6"], answer: "4" },
    { id: 3, question: "Which planet is known as the Red Planet?", options: ["Earth", "Mars", "Jupiter", "Venus"], answer: "Mars" },
    { id: 4, question: "What is the largest ocean?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], answer: "Pacific" },
    { id: 5, question: "What color do you get by mixing red and white?", options: ["Pink", "Purple", "Orange", "Brown"], answer: "Pink" },
];

export default function Game() {
    const channelRef = useRef(null);
    const { matchId } = useParams();
    const [gameOver, setGameOver] = useState(false);
    const [myEmail, setMyEmail] = useState("");
    const [opponentEmail, setOpponentEmail] = useState("");
    const [firstPlayerSent, setFirstPlayerSent] = useState(false);
    const [myScore, setMyScore] = useState(0);
    const [opponentScore, setOpponentScore] = useState(0);
    const [playerAnswered, setPlayerAnswered] = useState(false);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [timer, setTimer] = useState(10);
    const [selectedOption, setSelectedOption] = useState(null);
    const [correctAnswerPrompt, setCorrectAnswerPrompt] = useState("");
    const [loading, setLoading] = useState(true);

    const gameOverHandler = async () => {
        setGameOver(true);
        let winner = 'draw';
        if (myScore > opponentScore)
            winner = myEmail;
        else if (myScore < opponentScore)
            winner = opponentEmail;

        try {
            const res = await fetch("/api/update-winner", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    matchId,
                    winner: winner
                }),
            });

            const data = await res.json();
            if (!data.success) {
                console.error("Failed to update match:", data.error);
            } else {
                console.log("Match updated:", data);
            }
        } catch (err) {
            console.error("Error updating match:", err);
        }

        supabase.getChannels().forEach((ch) => supabase.removeChannel(ch));
    }

    useEffect(() => {
        return () => supabase.getChannels().forEach((ch) => supabase.removeChannel(ch));
    }, [])

    useEffect(() => {
        const fetchPlayer = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error || !data.session) {
                    router.replace("/login");
                    return;
                }
                setMyEmail(data.session.user.email);
            } catch (err) {
                console.error("Error fetching session:", err);
                setError("Unable to get your session.");
            }
        };
        fetchPlayer();
    }, []);

    useEffect(() => {
        if (!myEmail || typeof matchId !== "string") return;

        const allChannels = supabase.getChannels();
        const channel = allChannels.find(ch => ch.topic === `realtime:lobby:${matchId}`);
        if (!channel) return;

        channelRef.current = channel;

        if (!firstPlayerSent) {
            channel.send({ type: "broadcast", event: "player_email", payload: { email: myEmail } });
            setFirstPlayerSent(true);
        }

        const handlePlayerEmail = ({ payload }) => {
            setOpponentEmail(prev => {
                if (!prev && payload.email !== myEmail) {
                    console.log("player_email:", payload.email);
                    channel.send({ type: "broadcast", event: "player_email", payload: { email: myEmail } });
                    setLoading(false);
                    return payload.email;
                }
                return prev;
            });
        };

        const handleScoreUpdate = ({ payload }) => {
            if (payload.email === myEmail)
                setMyScore(payload.score);
            else
                setOpponentScore(payload.score);
        };

        const handleQuestionUpdate = ({ payload }) => {
            setSelectedOption(null);
            setCurrentQIndex((prev) => prev + 1);
            setTimer(10);
            setPlayerAnswered(false);
            setCorrectAnswerPrompt("");
        };

        const handleOptionUpdate = ({ payload }) => {
            clearInterval(interval);
            setPlayerAnswered(true);
            setSelectedOption(payload.option);
            setCorrectAnswerPrompt(`${payload.email} answered correct!`);
        };

        channel.on("broadcast", { event: "player_email" }, handlePlayerEmail);
        channel.on("broadcast", { event: "score_update" }, handleScoreUpdate);
        channel.on("broadcast", { event: "question_update" }, handleQuestionUpdate);
        channel.on("broadcast", { event: "option_update" }, handleOptionUpdate);

        return () => {
            channel.unsubscribe();
        };
    }, [myEmail, matchId]);






    const sendQuestionUpdate = async () => {
        if (!channelRef.current) return;
        await channelRef.current.send({
            type: "broadcast",
            event: "question_update",
            payload: {}
        });
    };

    const sendScoreUpdate = async () => {
        if (!channelRef.current) return;
        await channelRef.current.send({
            type: "broadcast",
            event: "score_update",
            payload: { email: myEmail, score: myScore + 1 }
        });
    };

    const sendOptionUpdate = async (option) => {
        if (!channelRef.current) return;
        await channelRef.current.send({
            type: "broadcast",
            event: "option_update",
            payload: { option: option, email: myEmail }
        });
    };


    const handleOptionClick = async (option) => {
        if (playerAnswered) return;

        if (option === questions[currentQIndex].answer) {
            sendScoreUpdate();
            await sendOptionUpdate(option);
            setTimeout(() => {
                sendQuestionUpdate();
            }, 1000);
        } else {
            setPlayerAnswered(true);
            setSelectedOption(option);
        }
    };

    useEffect(() => {
        if (typeof matchId !== "string" || gameOver) return;
        if (currentQIndex >= questions.length) {
            gameOverHandler();
            return;
        };
        interval = setInterval(async () => {
            setTimer((prev) => {
                if (prev <= 0) {
                    clearInterval(interval);
                    setSelectedOption(null);
                    setCurrentQIndex((prev) => prev + 1);
                    setTimer(10);
                    setPlayerAnswered(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [currentQIndex, gameOver]);

    if (loading)
        return <div className={styles.gameContainer}>Waiting for players...</div>
    return gameOver || currentQIndex >= questions.length ?
        <GameOver player1={myEmail} player2={opponentEmail} score1={myScore} score2={opponentScore} />
        :
        (
            <div className={styles.gameContainer}>
                {correctAnswerPrompt.length > 0 && <div className={styles.correctAnswerPrompt}>{correctAnswerPrompt}</div>}
                <div className={styles.playersBox}>
                    <div className={styles.playerEmail}>{myEmail}</div>
                    <strong>VS</strong>
                    <div className={styles.playerEmail}>{opponentEmail}</div>
                </div>

                <div className={styles.questionHeader}>Question {currentQIndex + 1} / {questions.length}</div>
                <p className={styles.gameQuestion}>{questions[currentQIndex].question}</p>

                <div className={styles.optionsContainer}>
                    {questions[currentQIndex].options.map((opt) => (
                        <button
                            key={opt}
                            className={`${styles.optionButton} ${selectedOption === opt
                                ? opt === questions[currentQIndex].answer
                                    ? styles.correct
                                    : styles.wrong
                                : ""
                                }`}
                            onClick={() => handleOptionClick(opt)}
                            disabled={!!selectedOption || playerAnswered}
                        >
                            {opt}
                        </button>
                    ))}
                </div>

                <p className={styles.questionMeta}>Time left: {timer}s</p>
                <p className={styles.questionMeta}>Score: {myScore}</p>
            </div>
        );
}
