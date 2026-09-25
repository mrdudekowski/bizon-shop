import { ROUTES } from "@/constants/navigation";
import { getTireTypes } from "./getTireTypes";

const STATIC_MENU_ITEMS = [
  {
    id: "about",
    label: "О нас",
    hasSubmenu: true,
    submenu: [
      { name: "О компании BIZON", link: ROUTES.about },
      { name: "Гарантия", link: ROUTES.warranty },
      { name: "People Stories", link: ROUTES.peopleStories },
    ],
  },
  {
    id: "shop",
    label: "Магазин",
    hasSubmenu: false,
    href: ROUTES.shop,
  },
  {
    id: "services",
    label: "Услуги",
    hasSubmenu: true,
    submenu: [
      { name: "Tire IQ", link: ROUTES.tireIq },
      { name: "Подбор и консультация", link: ROUTES.contact },
      { name: "Гарантийное обслуживание", link: ROUTES.warranty },
    ],
  },
  {
    id: "account",
    label: "Аккаунт",
    hasSubmenu: false,
    href: ROUTES.contact,
  },
];

export async function getMenuItems() {
  const tireTypes = await getTireTypes();
  const tireTypesSubmenu = tireTypes
    .filter((type) => type.showInMenu)
    .map((type) => ({
      id: type.slug,
      name: type.name,
      description: type.shortDescription,
      link: `${ROUTES.models}/${type.slug}`,
      image: true,
      imageUrl: type.imageUrl,
    }));

  return [
    {
      id: "models",
      label: "Модели",
      hasSubmenu: true,
      submenu: tireTypesSubmenu,
    },
    ...STATIC_MENU_ITEMS,
  ];
}
