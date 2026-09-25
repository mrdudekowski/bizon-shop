/** Preferred order for forged cards on /shop (CMS supplies name/image/meta). */
export const SHOP_HOME_WHEEL_SLUGS = ["atlas", "vector", "nomad"] as const;

export const SHOP_ORDER_STEPS = [
  {
    title: "Выберите дизайн",
    description: "Посмотрите модели и укажите предпочтительную конфигурацию.",
  },
  {
    title: "Расскажите об автомобиле",
    description: "Укажите марку, модель, год и пожелания к дискам.",
  },
  {
    title: "Получите подтверждение",
    description: "Специалист BIZON проверит совместимость, стоимость и возможность изготовления.",
  },
] as const;

export const SHOP_CATEGORY_SLIDES = [
  {
    id: "accessories",
    kicker: "Accessories",
    title: "Детали для движения",
    action: "Открыть Accessories",
    href: "/shop/accessories",
    desktopImage: "/images/premium/shop/lifestyle/categories/accessories-driver-glasses-primorye.png",
    mobileImage: "/images/premium/shop/lifestyle/categories/accessories-driver-glasses-primorye-mobile.png",
    alt: "Водитель в очках BIZON на приморской дороге",
  },
  {
    id: "outdoor",
    kicker: "Outdoor",
    title: "За пределами маршрута",
    action: "Открыть Outdoor",
    href: "/shop/outdoor",
    desktopImage: "/images/premium/shop/lifestyle/categories/outdoor-wrangler-camp-desktop.png",
    mobileImage: "/images/premium/shop/lifestyle/categories/outdoor-wrangler-camp-mobile.png",
    alt: "Wrangler BIZON и компания на летней стоянке у лесного озера",
  },
] as const;

export const SHOP_VEHICLE_STORIES = [
  {
    title: "Rubicon · Nomad",
    image: "/images/premium/shop/lifestyle/vehicles/wrangler-nomad-forest-desktop.png",
    alt: "Белый Rubicon с дисками BIZON Nomad на лесной дороге",
  },
  {
    title: "Skyline · Vector",
    image: "/images/premium/shop/lifestyle/vehicles/skyline-vector-vladivostok.png",
    alt: "Skyline с дисками BIZON Vector на ночной набережной Владивостока",
  },
  {
    title: "Bronco · Ember",
    image: "/images/premium/shop/lifestyle/vehicles/bronco-ember-summer.png",
    alt: "Bronco с красными дисками BIZON Ember в летнем Приморье",
  },
  {
    title: "TANK 300 · Bastion",
    image: "/images/premium/shop/lifestyle/vehicles/tank-300-bastion-coast-sup.png",
    alt: "Оранжевый TANK 300 с дисками BIZON Bastion на приморском утёсе",
  },
  {
    title: "Gladiator · Nomad",
    image: "/images/premium/shop/lifestyle/vehicles/gladiator-nomad-river.png",
    alt: "Зелёный Gladiator с дисками BIZON Nomad на каменистой реке",
  },
] as const;
