"use client";

type CartHeaderButtonProps = {
  count: number;
  onOpen: () => void;
};

export function CartHeaderButton({ count, onOpen }: CartHeaderButtonProps) {
  const label = count > 0 ? `Корзина, ${count} позиций` : "Корзина";

  return (
    <button
      type="button"
      className="cart-button"
      onClick={onOpen}
      aria-label={label}
      title="Корзина"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count > 0 && (
        <span className="cart-badge" aria-hidden="true">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
