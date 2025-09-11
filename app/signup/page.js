"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import AuthForm from "../components/AuthForm";
import Link from "next/link";
import styles from "../page.module.css";

export default function Signup() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const [user, setUser] = useState(null);

    useEffect(() => {
        // Check session
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                router.replace("/"); // redirect logged-in user to home
            } else {
                setUser(null); // show login form
            }
        });
    }, [router]);

    if (user) return null;

    const handleSignup = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) setErrorMsg(error.message);
        else router.push("/login"); // Redirect to login after signup
    };

    return (
        <div className={styles.page}>
            <Link href="/"><div className={styles.backButton}>←</div></Link>
            <h1>Signup</h1>
            <form onSubmit={handleSignup} className={styles.form}>
                <AuthForm email={email} setEmail={setEmail} password={password} setPassword={setPassword} />
                <button type="submit" className={`${styles.button} ${styles.toCenter}`}>Signup</button>
            </form>
            {errorMsg && <p className={styles.error}>{errorMsg}</p>}
            <p>
                Already have an account?{" "}
                <Link href="/login">
                    <button className={styles.linkButton}>
                        Login
                    </button>
                </Link>
            </p>
        </div>
    );
}
