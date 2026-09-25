import ProductCarousel from "../ProductCarousel/ProductCarousel.jsx";
import { SECTIONS } from "@/constants/sections";

/**
 * Секция категорий шин — тёмный cinematic блок
 */
export const ProductsSection = ({ tireTypes = [] }) => {
  return (
    <section id={SECTIONS.PRODUCTS} className="section section--dark">
      <div className="section-inner">
        <h2 className="section-title">Категории шин</h2>
        <p className="section-description">
          Магистральные, карьерные, внедорожные и универсальные решения для
          тяжёлой техники — подбор под ваш парк и условия эксплуатации.
        </p>
        <ProductCarousel items={tireTypes} />
      </div>
    </section>
  );
};
