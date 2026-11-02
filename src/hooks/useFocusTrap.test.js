// @vitest-environment happy-dom
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { useFocusTrap } from "./useFocusTrap";

function Trap({ active, children }) {
  const ref = useFocusTrap(active);
  return createElement("div", { ref, id: "trap" }, children);
}

function button(id, label) {
  return createElement("button", { type: "button", id }, label);
}

describe("useFocusTrap", () => {
  let host;
  let root;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  async function renderTrap(children, active = true) {
    const nodes = Array.isArray(children) ? children : [children];
    await act(async () => {
      root.render(createElement(Trap, { active }, ...nodes));
    });
    return document.getElementById("trap");
  }

  function tab(shiftKey = false) {
    const trap = document.getElementById("trap");
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true, shiftKey });
    trap.dispatchEvent(event);
    return event;
  }

  it("tabs into a control added after the trap opens instead of wrapping to the first", async () => {
    await renderTrap([button("logo", "BIZON"), button("back", "Назад")]);
    document.getElementById("back").focus();

    const model = document.createElement("a");
    model.id = "model";
    model.href = "/models/dsr158";
    model.textContent = "DSR158";
    document.getElementById("trap").appendChild(model);

    tab();

    expect(document.activeElement).toBe(model);
  });

  it("skips inert, hidden, aria-hidden, and non-visible nodes when the trap opens and on Tab", async () => {
    const pane = createElement(
      "div",
      { id: "pane", inert: true },
      button("hidden-model", "DSR158"),
    );
    await renderTrap([pane, button("logo", "BIZON")]);

    expect(document.activeElement?.id).toBe("logo");

    document.getElementById("pane").removeAttribute("inert");
    document.getElementById("pane").setAttribute("hidden", "");
    tab(true);
    expect(document.activeElement?.id).toBe("logo");

    document.getElementById("pane").removeAttribute("hidden");
    document.getElementById("pane").setAttribute("aria-hidden", "true");
    tab(true);
    expect(document.activeElement?.id).toBe("logo");

    document.getElementById("pane").removeAttribute("aria-hidden");
    document.getElementById("pane").style.display = "none";
    tab(true);
    expect(document.activeElement?.id).toBe("logo");
  });

  it("keeps Tab inside the live set after the focused node is removed", async () => {
    await renderTrap([button("logo", "BIZON"), button("back", "Назад"), button("model", "DSR158")]);
    const model = document.getElementById("model");
    model.focus();
    model.remove();

    tab();

    expect(document.getElementById("model")).toBeNull();
    expect(["logo", "back"]).toContain(document.activeElement?.id);
  });

  it("returns focus to the trigger when the trap closes", async () => {
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.textContent = "Открыть меню";
    document.body.appendChild(trigger);
    trigger.focus();

    function Toggle() {
      const [active, setActive] = useState(true);
      return createElement(
        "div",
        null,
        createElement("button", { type: "button", id: "close-trap", onClick: () => setActive(false) }, "Закрыть"),
        createElement(Trap, { active }, button("logo", "BIZON")),
      );
    }

    await act(async () => {
      root.render(createElement(Toggle));
    });
    expect(document.activeElement?.id).toBe("logo");

    await act(async () => {
      document.getElementById("close-trap").click();
    });

    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
