"use client";

type CartHeaderButtonProps = {
  count: number;
  onOpen: () => void;
};

export function CartHeaderButton({ count, onOpen }: CartHeaderButtonProps) {
  const lastTwo = count % 100;
  const last = count % 10;
  const positionWord = lastTwo >= 11 && lastTwo <= 14
    ? "позиций"
    : last === 1
      ? "позиция"
      : last >= 2 && last <= 4
        ? "позиции"
        : "позиций";
  const label = count > 0 ? `Корзина, ${count} ${positionWord}` : "Корзина";

  return (
    <button
      type="button"
      className="cart-button"
      onClick={onOpen}
      aria-label={label}
      title="Корзина"
    >
      <span className="cart-button-icon" aria-hidden="true" />
      {count > 0 && (
        <span className="cart-badge" aria-hidden="true">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
