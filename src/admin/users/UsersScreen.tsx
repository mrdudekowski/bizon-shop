"use client";

import { useEffect, useRef, useState } from "react";

import { AdminClientError } from "@/admin/client/errors";
import { ERROR_TEXT } from "@/admin/client/errorText";
import { browserAdminClient } from "@/admin/client/localStore";
import type { AdminRole, AdminSession, AdminUser, EditorCapability } from "@/admin/domain/types";
import type { PasswordResetHistoryItem } from "@/admin/domain/types";

import styles from "./UsersScreen.module.css";
import { Icon } from "@/admin/ui/Icon";
import { AdminLoading } from "@/admin/ui/AdminLoading";

const USER_ERROR_TEXT: Partial<Record<string, string>> = {
  ...ERROR_TEXT,
  cannot_disable_self: "Нельзя отключить свою учётную запись",
  slug_taken: "Такой логин уже есть",
  invalid_slug: "Укажите логин",
};

const CAPABILITY_LABEL: Record<EditorCapability, string> = {
  create_catalog_items: "Новые модели шин, дисков и товаров",
  edit_site_pages: "Контент и тексты на страницах",
};

export function UsersScreen() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resetDialogRef = useRef<HTMLDialogElement>(null);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [passwordHistory, setPasswordHistory] = useState<PasswordResetHistoryItem[]>([]);
  const [login, setLogin] = useState("");
  const [role, setRole] = useState<AdminRole>("editor");
  const [password, setPassword] = useState("");
  const [resetUser, setResetUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [createCapabilities, setCreateCapabilities] = useState<EditorCapability[]>([]);
  const [message, setMessage] = useState("");
  const activeAdmins = users.filter((user) => user.role === "admin" && !user.disabled).length;

  async function reload() {
    const client = browserAdminClient();
    const [nextUsers, nextHistory] = await Promise.all([
      client.listUsers(),
      client.listPasswordResetHistory(),
    ]);
    setUsers(nextUsers);
    setPasswordHistory(nextHistory);
  }

  useEffect(() => {
    void browserAdminClient()
      .getSession()
      .then((next) => {
        setSession(next);
        if (next.role === "admin") void reload().catch(showError);
      });
  }, []);

  if (session == null) return <main className={styles.screen}><AdminLoading /></main>;
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
    setMessage(USER_ERROR_TEXT[code] ?? code);
  }

  function openCreate() {
    setLogin("");
    setRole("editor");
    setPassword("");
    setCreateCapabilities([]);
    setMessage("");
    dialogRef.current?.showModal();
  }

  function openPasswordReset(user: AdminUser) {
    setResetUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setMessage("");
    resetDialogRef.current?.showModal();
  }

  function toggleCapability(current: EditorCapability[], capability: EditorCapability, checked: boolean) {
    return checked ? [...current, capability] : current.filter((item) => item !== capability);
  }

  function saveCapabilities(userId: string, capabilities: EditorCapability[]) {
    setMessage("");
    void browserAdminClient().setUserCapabilities(userId, capabilities).then(reload).catch(showError);
  }

  return (
    <main className={styles.screen}>
      <div className={styles.pageHead}><div><h1>Пользователи</h1><p className="subheading">Управление доступом к редактору BIZON.</p></div><button className="primary" type="button" onClick={openCreate}><Icon name="plus" size={18}/> Добавить пользователя</button></div>
      {message ? <p role="status">{message}</p> : null}
      <dialog ref={dialogRef} className={styles.dialog}>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          setMessage("");
          void browserAdminClient()
            .createUser({ login, role, password, capabilities: role === "editor" ? createCapabilities : [] })
            .then(() => {
              dialogRef.current?.close();
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
        {role === "editor" ? (
          <fieldset className={styles.capabilitySet}>
            <legend>Права редактора</legend>
            {(Object.keys(CAPABILITY_LABEL) as EditorCapability[]).map((capability) => (
              <label key={capability}>
                <input
                  type="checkbox"
                  checked={createCapabilities.includes(capability)}
                  onChange={(event) => setCreateCapabilities(toggleCapability(createCapabilities, capability, event.target.checked))}
                />
                {CAPABILITY_LABEL[capability]}
              </label>
            ))}
          </fieldset>
        ) : <p className={styles.hint}>Полный доступ</p>}
        <label>Пароль при создании<input
          aria-label="Пароль"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        /><span className={styles.hint}>Пароль сразу хешируется на сервере. Посмотреть его позже нельзя.</span></label>
        {message ? <p role="alert">{message}</p> : null}
        <div className={styles.actions}><button type="button" className="ghost" onClick={() => dialogRef.current?.close()}>Отмена</button><button className="primary" type="submit"><Icon name="plus" size={18}/> Добавить</button></div>
      </form>
      </dialog>
      <dialog ref={resetDialogRef} className={styles.dialog}>
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            if (resetUser == null) return;
            if (newPassword !== confirmPassword) {
              setMessage("Пароли не совпадают");
              return;
            }
            setMessage("");
            void browserAdminClient()
              .resetUserPassword(resetUser.id, newPassword)
              .then(() => {
                resetDialogRef.current?.close();
                setNewPassword("");
                setConfirmPassword("");
                setResetUser(null);
                setMessage(`Пароль пользователя ${resetUser.login} обновлён. Все его входы завершены.`);
                return reload();
              })
              .catch(showError);
          }}
        >
          <h2>Новый пароль: {resetUser?.login}</h2>
          <label>Новый пароль<input
            aria-label="Новый пароль"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          /><span className={styles.hint}>Не менее 12 символов. Пароль нельзя будет посмотреть после сохранения.</span></label>
          <label>Повторите пароль<input
            aria-label="Повторите пароль"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          /></label>
          {message ? <p role="alert">{message}</p> : null}
          <div className={styles.actions}><button type="button" className="ghost" onClick={() => resetDialogRef.current?.close()}>Отмена</button><button className="primary" type="submit">Сохранить новый пароль</button></div>
        </form>
      </dialog>
      <ul className={styles.userList}>
        {users.map((user) => (
          <li className={styles.userRow} key={user.id}>
            <div className={styles.identity}><strong>{user.login}</strong>{user.login === session.login ? <span className={styles.you}>Вы</span> : null}</div>
            <label className={styles.roleField}>Роль
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
            </label>
            {user.role === "admin" ? <p className={styles.fullAccess}>Полный доступ</p> : (
              <fieldset className={styles.capabilitySet} disabled={user.disabled}>
                <legend>Права</legend>
                {(Object.keys(CAPABILITY_LABEL) as EditorCapability[]).map((capability) => (
                  <label key={capability}>
                    <input
                      type="checkbox"
                      checked={(user.capabilities ?? []).includes(capability)}
                      onChange={(event) => saveCapabilities(user.id, toggleCapability(user.capabilities ?? [], capability, event.target.checked))}
                    />
                    {CAPABILITY_LABEL[capability]}
                  </label>
                ))}
              </fieldset>
            )}
            <span className={user.disabled ? styles.badge : styles.badgeOnSite}>{user.disabled ? "Отключён" : "Активен"}</span>
            <div className={styles.userActions}>
              {user.login !== session.login ? <button type="button" className="ghost" onClick={() => openPasswordReset(user)}>Сбросить пароль</button> : <span className={styles.hint}>Сбросить пароль может другой администратор</span>}
              {user.disabled ? <span className={styles.hint}>Доступ отключён</span> : user.login === session.login ? <span className={styles.hint}>Нельзя отключить себя</span> : user.role === "admin" && activeAdmins < 2 ? <span className={styles.hint}>Администратора нельзя удалить</span> : (
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  if (!window.confirm("Отключить доступ пользователя " + user.login + "? Он больше не сможет войти в админку.")) return;
                  setMessage("");
                  void browserAdminClient().disableUser(user.id).then(reload).catch(showError);
                }}
              >
                Отключить
              </button>
              )}
            </div>
            {user.role === "editor" ? <p className={styles.crmNote}>Скоро: работа с лидами и CRM. Эти права появятся вместе с модулем.</p> : null}
          </li>
        ))}
      </ul>
      <section aria-labelledby="password-history-heading">
        <h2 id="password-history-heading">История сбросов пароля</h2>
        {passwordHistory.length === 0 ? <p className={styles.hint}>Сбросов пока не было</p> : (
          <ul className={styles.userList}>
            {passwordHistory.map((entry) => (
              <li className={styles.userRow} key={entry.id}>
                <strong>{entry.targetLogin}</strong>
                <span>Сбросил: {entry.resetBy}</span>
                <time dateTime={entry.resetAt}>{new Date(entry.resetAt).toLocaleString("ru-RU")}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className={styles.tableFoot}>{users.filter((user) => !user.disabled).length} активных из {users.length}</div>
    </main>
  );
}
