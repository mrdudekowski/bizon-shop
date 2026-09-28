"use client";

import { Icon, type IconName } from "@/admin/ui/Icon";

export function SectionAccessNotice({ title, icon = "users" }: { title: string; icon?: IconName }) {
  return (
    <main className="document">
      <h1>{title}</h1>
      <div className="notice">
        <Icon name={icon} size={24} />
        <p>
          <strong>Этот раздел недоступен</strong>
          <br />
          Попросите администратора выдать право или открыть его сам.
        </p>
      </div>
    </main>
  );
}
