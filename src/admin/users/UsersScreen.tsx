"use client";

import { useEffect, useState } from "react";

import { AdminClientError } from "@/admin/client/errors";
import { browserAdminClient } from "@/admin/client/localStore";
import type { AdminRole, AdminSession, AdminUser } from "@/admin/domain/types";

import styles from "./UsersScreen.module.css";

const ERROR_TEXT: Partial<Record<string, string>> = {
  cannot_disable_self: "Нельзя отключить свою учётную запись",
  last_admin: "Нельзя отключить последнего администратора",
  slug_taken: "Такой логин уже есть",
  invalid_slug: "Укажите логин",
};

export function UsersScreen() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [login, setLogin] = useState("");
  const [role, setRole] = useState<AdminRole>("editor");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function reload() {
    setUsers(await browserAdminClient().listUsers());
  }

  useEffect(() => {
    void browserAdminClient()
      .getSession()
      .then((next) => {
        setSession(next);
        if (next.role === "admin") void reload();
      });
  }, []);

  if (session == null) return <main className={styles.screen}>Загрузка…</main>;
  if (session.role === "editor") {
    return (
      <main className={styles.screen}>
        <p>Раздел доступен администратору</p>
      </main>
    );
  }

  function showError(error: unknown) {
    const code = error instanceof AdminClientError ? error.code : "error";
    setMessage(ERROR_TEXT[code] ?? code);
  }

  return (
    <main className={styles.screen}>
      <h1>Пользователи</h1>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          setMessage("");
          void browserAdminClient()
            .createUser({ login, role, password })
            .then(() => {
              setLogin("");
              setPassword("");
              return reload();
            })
            .catch(showError);
        }}
      >
        <input aria-label="Логин" value={login} onChange={(event) => setLogin(event.target.value)} />
        <select aria-label="Роль" value={role} onChange={(event) => setRole(event.target.value as AdminRole)}>
          <option value="editor">Редактор</option>
          <option value="admin">Администратор</option>
        </select>
        <input
          aria-label="Пароль"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button type="submit">Добавить</button>
      </form>
      {message ? <p>{message}</p> : null}
      <ul className={styles.list}>
        {users.map((user) => (
          <li key={user.id} className={styles.row}>
            <span>{user.login}</span>
            <select
              aria-label={`Роль ${user.login}`}
              value={user.role}
              disabled={user.disabled}
              onChange={(event) => {
                setMessage("");
                void browserAdminClient()
                  .setUserRole(user.id, event.target.value as AdminRole)
                  .then(reload)
                  .catch((error) => {
                    if (error instanceof AdminClientError && error.code === "last_admin") {
                      setMessage("Нельзя снять роль у последнего администратора");
                      return;
                    }
                    showError(error);
                  });
              }}
            >
              <option value="editor">Редактор</option>
              <option value="admin">Администратор</option>
            </select>
            <span>{user.disabled ? "отключён" : "активен"}</span>
            {user.disabled ? null : (
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  void browserAdminClient().disableUser(user.id).then(reload).catch(showError);
                }}
              >
                Отключить
              </button>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
