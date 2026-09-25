"use client";

import { useEffect, useState } from "react";

import { AdminClientError } from "@/admin/client/errors";
import { browserAdminClient } from "@/admin/client/localStore";
import type { AdminRole, AdminSession, AdminUser } from "@/admin/domain/types";

import styles from "./UsersScreen.module.css";
import { Icon } from "@/admin/ui/Icon";

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
  const activeAdmins = users.filter((user) => user.role === "admin" && !user.disabled).length;

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
        <h1>Управление пользователями</h1>
        <div className={styles.notice}><Icon name="users" size={24}/><p><strong>Этот раздел доступен только администратору</strong><br/>Попросите администратора управлять учётными записями.</p></div>
      </main>
    );
  }

  function showError(error: unknown) {
    const code = error instanceof AdminClientError ? error.code : "error";
    setMessage(ERROR_TEXT[code] ?? code);
  }

  return (
    <main className={styles.screen}>
      <div><h1>Пользователи</h1><p className="subheading">Управление доступом к редактору BIZON.</p></div>
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
        <label>Логин<input autoComplete="off" placeholder="Имя для входа" aria-label="Логин" value={login} onChange={(event) => setLogin(event.target.value)} required /></label>
        <label>Роль<select aria-label="Роль" value={role} onChange={(event) => setRole(event.target.value as AdminRole)}>
          <option value="editor">Редактор</option>
          <option value="admin">Администратор</option>
        </select></label>
        <label>Пароль при создании<input
          aria-label="Пароль"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        /><span className={styles.hint}>Пароль применяется при создании и не хранится в CMS.</span></label>
        <button className="primary" type="submit"><Icon name="plus" size={18}/> Добавить пользователя</button>
      </form>
      {message ? <p>{message}</p> : null}
      <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Логин</th><th>Роль</th><th>Доступ</th><th>Действие</th></tr></thead><tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.login}{user.login === session.login ? <span className={styles.you}> · Вы</span> : null}</td>
            <td>
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
            </td>
            <td><span className={user.disabled ? styles.badge : styles.badgeOnSite}>{user.disabled ? "Отключён" : "Активен"}</span></td>
            <td>{user.disabled ? <span className={styles.hint}>Доступ отключён</span> : user.login === session.login ? <span className={styles.hint}>Нельзя отключить себя</span> : user.role === "admin" && activeAdmins < 2 ? <span className={styles.hint}>Последний администратор</span> : (
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  setMessage("");
                  void browserAdminClient().disableUser(user.id).then(reload).catch(showError);
                }}
              >
                Отключить
              </button>
            )}</td>
          </tr>
        ))}
      </tbody></table><div className={styles.tableFoot}>{users.filter((user) => !user.disabled).length} активных из {users.length}</div></div>
    </main>
  );
}
