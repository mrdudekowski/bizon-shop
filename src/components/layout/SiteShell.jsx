"use client";

import { DualPaneMenu } from "@/components/DualPaneMenu/DualPaneMenu";
import { BackToTop } from "@/components/BackToTop/BackToTop.jsx";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { MainChrome } from "@/components/main/MainChrome";
import { ShopChrome } from "@/components/shop/ShopChrome";
import { ShopFooter } from "@/components/shop/ShopFooter";
import { Footer } from "@/components/Footer/Footer.jsx";
import { useCart } from "@/hooks/useCart";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useMenuToggle } from "@/hooks/useMenuToggle";
import { scrollToTop } from "@/lib/scroll";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants/navigation";

/**
 * Client shell: header, burger menu, footer, scroll helpers.
 * Wraps all public site pages.
 */
export function SiteShell({ children, mainMenu, shopMenu }) {
  const { menuOpen, closeMenu, toggleMenu } = useMenuToggle();
  const cart = useCart();
  const pathname = usePathname();
  const isShop = pathname === ROUTES.shop || pathname.startsWith(`${ROUTES.shop}/`);
  const menu = isShop ? shopMenu : mainMenu;
  const categoryItems = shopMenu?.sections?.find((section) => section.id === "categories")?.items ?? [];
  const categoryLinks = [
    ...categoryItems.filter((item) => item.id !== "all-categories"),
    ...categoryItems.filter((item) => item.id === "all-categories"),
  ].map((item) => ({ href: item.href, label: item.title }));
  useBodyScrollLock(cart.open, "cart-open");

  return (
    <>
      <div
        className={`page ${menuOpen ? "page--blurred" : ""}`}
        inert={menuOpen || cart.open ? true : undefined}
      >
        <a className="skip-link" href="#main">
          Перейти к контенту
        </a>

        {isShop ? (
          <ShopChrome
            menuOpen={menuOpen}
            onMenuToggle={toggleMenu}
            cartCount={cart.count}
            onCartOpen={() => cart.setOpen(true)}
            categoryLinks={categoryLinks}
          />
        ) : (
          <MainChrome
            menuOpen={menuOpen}
            onMenuToggle={toggleMenu}
            cartCount={cart.count}
            onCartOpen={() => cart.setOpen(true)}
          />
        )}

        <main id="main" className={isShop ? "main--shop" : undefined}>{children}</main>

        {isShop ? <ShopFooter catalogLinks={categoryLinks} /> : <Footer />}

        <BackToTop onScrollToTop={scrollToTop} />
      </div>

      <DualPaneMenu
        isOpen={menuOpen}
        onClose={closeMenu}
        menu={menu}
        context={isShop ? "shop" : "main"}
        title={isShop ? "Меню BIZON Shop" : "Меню BIZON Tires"}
        homeHref={isShop ? ROUTES.shop : ROUTES.home}
        homeLabel={isShop ? "BIZON SHOP" : "BIZON"}
        featuredItem={isShop ? { name: "Выбрать диски", link: "/shop#wheels" } : null}
        cartItem={{
          name: `Корзина${cart.count > 0 ? ` · ${cart.count}` : ""}`,
          link: "/cart",
        }}
      />

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
