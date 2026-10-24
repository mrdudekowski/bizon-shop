"use client";

import { DualPaneMenu } from "@/components/DualPaneMenu/DualPaneMenu";
import { BackToTop } from "@/components/BackToTop/BackToTop.jsx";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { MainChrome } from "@/components/main/MainChrome";
import { ShopChrome } from "@/components/shop/ShopChrome";
import { ShopFooter } from "@/components/shop/ShopFooter";
import { Footer } from "@/components/Footer/Footer.jsx";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useCart } from "@/hooks/useCart";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useMenuToggle } from "@/hooks/useMenuToggle";
import { scrollToTop } from "@/lib/scroll";
import { useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ROUTES } from "@/constants/navigation";
import { fetchBrowserTireCatalog } from "@/lib/catalog/browserTireCatalog";
import { buildMainDualPaneMenuSections, buildShopDualPaneMenuSections } from "@/lib/content/buildDualPaneMenu";
import { fetchBrowserPublishedList } from "@/lib/content/browserPublishedClient";

/**
 * Client shell: header, burger menu, footer, scroll helpers.
 * Wraps all public site pages.
 */
export function SiteShell({ children, mainMenu, shopMenu }) {
  const { menuOpen, closeMenu, toggleMenu } = useMenuToggle();
  const [runtimeMainMenu, setRuntimeMainMenu] = useState(mainMenu);
  const [runtimeShopMenu, setRuntimeShopMenu] = useState(shopMenu);
  const [menuRefreshed, setMenuRefreshed] = useState(false);
  const [publishedCategories, setPublishedCategories] = useState(null);
  const lenis = useLenis();
  const pathname = usePathname();
  const isShop = pathname === ROUTES.shop || pathname.startsWith(`${ROUTES.shop}/`);
  const cartKind = isShop ? "shop" : "bizon";
  const cart = useCart(cartKind);
  const menu = isShop ? runtimeShopMenu : runtimeMainMenu;
  const categoryItems = runtimeShopMenu?.sections?.find((section) => section.id === "categories")?.items ?? [];
  const categoryLinks = publishedCategories ? [
    ...publishedCategories.filter((category) => category.showInMenu).sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => ({ href: `${ROUTES.shop}/${category.slug}`, label: category.name })),
    { href: ROUTES.shopCategories, label: "Все категории" },
  ] : [
    ...categoryItems.filter((item) => item.id !== "all-categories"),
    ...categoryItems.filter((item) => item.id === "all-categories"),
  ].map((item) => ({ href: item.href, label: item.title }));
  useBodyScrollLock(cart.open, "cart-open");

  useEffect(() => {
    const controller = new AbortController();
    void fetchBrowserPublishedList("/v1/shop/categories", controller.signal)
      .then(setPublishedCategories)
      .catch((error) => {
        if (!controller.signal.aborted) console.warn("Could not refresh Shop footer categories; showing generated links.", error);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!menuOpen || menuRefreshed) return;
    const controller = new AbortController();
    void Promise.all([
      fetchBrowserTireCatalog(controller.signal),
      fetchBrowserPublishedList("/v1/articles", controller.signal),
      fetchBrowserPublishedList("/v1/shop/categories", controller.signal),
      fetchBrowserPublishedList("/v1/wheels/types", controller.signal),
    ]).then(async ([tires, articles, categories, wheelTypes]) => {
      const wheelGroups = await Promise.all(wheelTypes.map((type) =>
        fetchBrowserPublishedList(`/v1/wheels/types/${encodeURIComponent(type.slug)}/models`, controller.signal),
      ));
      if (controller.signal.aborted) return;
      const tireModels = tires.directions.flatMap((direction) => direction.models);
      setRuntimeMainMenu({ defaultSectionId: "models", sections: buildMainDualPaneMenuSections({ models: tireModels, articles, categories }) });
      setRuntimeShopMenu({ defaultSectionId: "wheels", sections: buildShopDualPaneMenuSections({ wheels: wheelGroups.flat(), categories }) });
      setMenuRefreshed(true);
    }).catch((error) => {
      if (!controller.signal.aborted) console.warn("Could not refresh published menu content; showing generated menu.", error);
    });
    return () => controller.abort();
  }, [menuOpen, menuRefreshed]);

  return (
    <>
      <div
        className={`page page--with-mobile-nav ${menuOpen ? "page--blurred" : ""}`}
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

        <BackToTop onScrollToTop={() => scrollToTop(lenis)} />
        <MobileBottomNav context={isShop ? "shop" : "main"} cartCount={cart.count} />
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
          link: isShop ? ROUTES.shopCart : ROUTES.cart,
        }}
      />

      <CartDrawer
        cartKind={cartKind}
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
