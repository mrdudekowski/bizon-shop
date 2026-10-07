"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";

import { AdminClientError } from "@/admin/client/errors";
import { ERROR_TEXT } from "@/admin/client/errorText";
import { browserAdminClient } from "@/admin/client/localStore";
import type { AdminSession } from "@/admin/domain/types";

import styles from "./LoginScreen.module.css";

export function LoginScreen({ onLogin }: { onLogin: (session: AdminSession) => void }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      onLogin(await browserAdminClient().login(login.trim(), password));
      setPassword("");
    } catch (reason) {
      if (reason instanceof AdminClientError && reason.code === "invalid_credentials") {
        setError("Неверный логин или пароль.");
      } else if (reason instanceof AdminClientError && reason.code === "login_throttled") {
        setError(ERROR_TEXT.login_throttled);
      } else {
        setError("Не удалось войти. Проверьте подключение и попробуйте ещё раз.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.screen}>
      <section className={styles.card} aria-labelledby="login-title">
        <Image className={styles.logo} src="/brand/bizon-full.svg" alt="BIZON" width={132} height={62} priority unoptimized />
        <div>
          <h1 id="login-title">Вход в CMS</h1>
          <p>Введите логин и пароль, чтобы продолжить.</p>
        </div>
        <form className={styles.form} onSubmit={submit}>
          <label htmlFor="cms-login">Логин</label>
          <input
            id="cms-login"
            autoComplete="username"
            autoFocus
            required
            value={login}
            onChange={(event) => setLogin(event.target.value)}
          />
          <label htmlFor="cms-password">Пароль</label>
          <input
            id="cms-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <button className="primary" type="submit" disabled={submitting}>
            {submitting ? "Входим…" : "Войти"}
          </button>
        </form>
      </section>
    </main>
  );
}
