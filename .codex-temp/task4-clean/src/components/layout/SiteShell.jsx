"use client";

import BurgerMenu from "@/components/BurgerMenu/BurgerMenu.jsx";
import { BackToTop } from "@/components/BackToTop/BackToTop.jsx";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Header } from "@/components/Header/Header.jsx";
import { Footer } from "@/components/Footer/Footer.jsx";
import { useCart } from "@/hooks/useCart";
import { useMenuToggle } from "@/hooks/useMenuToggle";
import { scrollToTop } from "@/lib/scroll";

/**
 * Client shell: header, burger menu, footer, scroll helpers.
 * Wraps all public site pages.
 */
export function SiteShell({ children, menuItems }) {
  const { menuOpen, closeMenu, toggleMenu } = useMenuToggle();
  const cart = useCart();

  return (
    <>
      <div className={`page ${menuOpen ? "page--blurred" : ""}`}>
        <a className="skip-link" href="#main">
          Перейти к контенту
        </a>

        <Header
          menuOpen={menuOpen}
          onMenuToggle={toggleMenu}
          cartCount={cart.count}
          onCartOpen={() => cart.setOpen(true)}
        />

        <main id="main">{children}</main>

        <Footer />

        <BackToTop onScrollToTop={scrollToTop} />
      </div>

      <BurgerMenu isOpen={menuOpen} onClose={closeMenu} menuItems={menuItems} />

      <CartDrawer
        open={cart.open}
        items={cart.items}
        onClose={() => cart.setOpen(false)}
        onRemove={cart.removeItem}
        onQuantityChange={cart.setQuantity}
        onClear={cart.clear}
      />
    </>
  );
}
