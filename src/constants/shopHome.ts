/** Preferred order for forged cards on /shop (CMS supplies name/image/meta). */
export const SHOP_HOME_WHEEL_SLUGS = ["atlas", "nomad", "bastion"] as const;

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
