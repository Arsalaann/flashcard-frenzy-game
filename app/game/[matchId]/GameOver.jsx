"use client";

import Link from "next/link";
import styles from "./GameOver.module.css";

export default function GameOver({ player1, player2, score1, score2 }) {

    let winner;
    if (score1 > score2) winner = player1;
    else if (score2 > score1) winner = player2;
    else winner = "Draw";

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Game Over</h1>

            <div className={styles.players}>
                <div className={styles.playerBox}>
                    <h2>{player1}</h2>
                    <p>Score: {score1}</p>
                </div>

                <div className={styles.playerBox}>
                    <h2>{player2}</h2>
                    <p>Score: {score2}</p>
                </div>
            </div>

            <div className={styles.winnerBox}>
                <h2>Winner: {winner}</h2>
            </div>

            <Link href="/">
                <button className={styles.homeButton}>
                    Home
                </button>
            </Link>

        </div>
    );
}
