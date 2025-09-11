"use client";

import styles from "../page.module.css";

export default function AuthForm({ email, setEmail, password, setPassword }) {
  return (
    <div className={styles.authForm}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className={styles.input}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className={styles.input}
      />
    </div>
  );
}
