"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";
import AuthForm from "../components/AuthForm";
import styles from "../page.module.css";


export default function Login() {
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

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) setErrorMsg(error.message);
        else router.push("/"); // Redirect to Home after login
    };

    return (
        <div className={styles.page}>
            <Link href="/"><div className={styles.backButton}>←</div></Link>
            <h1>Login</h1>
            <form onSubmit={handleLogin} className={styles.form}>
                <AuthForm email={email} setEmail={setEmail} password={password} setPassword={setPassword} />
                <button type="submit" className={`${styles.button} ${styles.toCenter}`}>Login</button>
            </form>
            {errorMsg && <p className={styles.error}>{errorMsg}</p>}
            <p>
                Don't have an account?{" "}
                <Link href="/signup">
                    <button className={styles.linkButton}>
                        Signup
                    </button>
                </Link>
            </p>
        </div>
    );
}
