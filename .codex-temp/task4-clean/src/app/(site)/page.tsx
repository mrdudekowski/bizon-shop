import { Hero } from "@/components/Hero/Hero.jsx";
import { ProductsSection } from "@/components/ProductsSection/ProductsSection.jsx";
import { FeaturesSection } from "@/components/FeaturesSection/FeaturesSection.jsx";
import { AccessoriesSection } from "@/components/AccessoriesSection/AccessoriesSection.jsx";
import { ContactSection } from "@/components/ContactSection/ContactSection.jsx";
import { getTireTypes } from "@/lib/cms";

export default async function HomePage() {
  const tireTypes = await getTireTypes();

  return (
    <>
      <Hero />
      <ProductsSection tireTypes={tireTypes} />
      <FeaturesSection />
      <AccessoriesSection />
      <ContactSection />
    </>
  );
}
