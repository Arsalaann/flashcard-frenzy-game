'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const session = supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setUser(data.session.user);
      } else {
        setUser(null);
      }
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setUser(session.user);
      else setUser(null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handlePlay = () => {
    router.push("/game");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  const handleSignup = () => {
    router.push("/signup");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };


  return (
    <div className={styles.page}>
      <h1>Welcome to Flashcard Frenzy!</h1>
      <p className={styles.desc}>Race against another player to answer flashcards and score points!</p>

      {user ? (
        <div>
          <button onClick={handlePlay} className={styles.button}>Play</button>
          <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
        </div>
      ) : (
        <div>
          <button onClick={handleLogin} className={styles.button}>
            Login
          </button>
          <button onClick={handleSignup} className={styles.button}>
            Signup
          </button>
        </div>
      )}
    </div>
  );
}
