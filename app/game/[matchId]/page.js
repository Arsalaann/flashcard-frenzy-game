"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useParams } from "next/navigation";
import GameOver from './GameOver';
import styles from "./page.module.css";

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
    const [playersAnswered, setPlayersAnswered] = useState({}); // keys: emails, value: boolean answered
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [timer, setTimer] = useState(10);
    const [selectedOption, setSelectedOption] = useState(null);
    const [loading, setLoading] = useState(true);

    const gameOverHandler = () => {
        setGameOver(true);
        supabase.getChannels().forEach((ch) => supabase.removeChannel(ch));
    }

    useEffect(()=>{
        return()=>supabase.getChannels().forEach((ch) => supabase.removeChannel(ch));
    },[])

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
        console.log("channels:", allChannels);
        const channel = allChannels.find(
            (ch) => ch.topic === `realtime:lobby:${matchId}`
        );

        if (!channel) {
            console.warn("No existing channel found, cannot join game page.");
            return;
        }

        channelRef.current = channel;

        if (!firstPlayerSent) {
            channel.send({
                type: "broadcast",
                event: "player_email",
                payload: { email: myEmail },
            });
        }

        channel.on("broadcast", { event: "player_email" }, ({ payload }) => {
            console.log("player_email:", payload.email);
            if (payload.email !== myEmail) {
                setOpponentEmail(payload.email);
                if (!firstPlayerSent) {
                    channel.send({
                        type: "broadcast",
                        event: "player_email",
                        payload: { email: myEmail },
                    });
                    setFirstPlayerSent(true);
                    setLoading(false);
                }
            }
        });

        channel.on("broadcast", { event: "score_update" }, ({ payload }) => {
            if (payload.email === myEmail) {
                setMyScore(payload.score);
            } else {
                setOpponentScore(payload.score);
            }
        });

        channel.on("broadcast", { event: "question_update" }, ({ payload }) => {
            setCurrentQIndex(payload.currentQIndex);
            setTimer(payload.timer);
            setPlayersAnswered(payload.playersAnswered || {});
        });
    }, [myEmail, matchId]);





    const sendQuestionUpdate = async (updatedPlayersAnswered = {}, index = currentQIndex, time = timer) => {
        if (!channelRef.current) return;
        await channelRef.current.send({
            type: "broadcast",
            event: "question_update",
            payload: {
                currentQIndex: index,
                timer: time,
                playersAnswered: updatedPlayersAnswered,
            },
        });
    };


    const handleOptionClick = async (option) => {
        if (playersAnswered[myEmail]) return;

        const updatedAnswers = { ...playersAnswered, [myEmail]: true };
        setPlayersAnswered(updatedAnswers);
        setSelectedOption(option);

        if (option === questions[currentQIndex].answer) {
            setMyScore((prev) => prev + 1);
            await sendQuestionUpdate(updatedAnswers);

            setTimeout(() => {
                handleNextQuestion();
            }, 1000);
        } else {
            await sendQuestionUpdate(updatedAnswers);
        }

    };

    const handleNextQuestion = async () => {
        setSelectedOption(null);
        if (currentQIndex+1 < questions.length) {
            const nextIndex = currentQIndex + 1;
            setCurrentQIndex(nextIndex);
            setPlayersAnswered({});
            setTimer(10);
            await sendQuestionUpdate({});
        } else {
            gameOverHandler();
        }
    };


    useEffect(() => {
        if (typeof matchId !== "string" || gameOver) return;
        if (currentQIndex >= questions.length) return;
        const interval = setInterval(async () => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    const updatedAnswers = { ...playersAnswered, [myEmail]: true };
                    setPlayersAnswered(updatedAnswers);
                    sendQuestionUpdate(updatedAnswers);
                    handleNextQuestion();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [currentQIndex, gameOver]);

    if (loading)
        return <div>waiting for players...</div>
    return gameOver ?
        <GameOver player1={myEmail} player2={opponentEmail} score1={myScore} score2={opponentScore} />
        :
        (
            <div className={styles.gameContainer}>
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
                            disabled={!!selectedOption || playersAnswered[myEmail]}
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
