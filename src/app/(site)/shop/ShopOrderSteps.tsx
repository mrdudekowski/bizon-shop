import styles from "./ShopHome.module.css";

type ShopOrderStep = {
  title: string;
  description: string;
};

export function ShopOrderSteps({ steps }: { steps: ShopOrderStep[] }) {
  return (
    <div className={styles.orderSteps} aria-label="Как заказать кованые диски BIZON">
      {steps.map((step, index) => (
        <article key={`${step.title}-${index}`}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <h2>{step.title}</h2>
          <p>{step.description}</p>
        </article>
      ))}
    </div>
  );
}
