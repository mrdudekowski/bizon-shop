# Цветовая система публичного сайта BIZON

**Область:** публичный сайт и магазин. Стили CMS в документ не входят.
**Единый источник CSS-токенов:** [`src/app/globals.css`](../../src/app/globals.css), блок `:root` с комментарием `BIZON visual tokens — canonical SSOT for public UI`.

## Принцип назначения цвета

Компонент выбирает цвет по **роли**, контексту и состоянию, а не подставляет hex-код напрямую:

1. **Роль элемента:** основное действие — коралловый, вторичный текст — нейтральный, состояние наличия — мятное, ошибка — destructive.
2. **Поверхность:** светлая страница использует тёмный текст; тёмная секция — белый текст и более заметные CTA.
3. **Состояние элемента:** hover, выбранный вариант, disabled и focus назначают свои значения.
4. **Контекст бренда:** `[data-brand-context="shop"]` меняет оттенок акцентных заголовков и фон градиента.
5. **Изображение/фон:** альфа-слой смешивается с фотографией через `color-mix()`. Прозрачность регулирует плотность слоя, базовый цвет берётся из токена.

Номер оттенка сам по себе не переключается автоматически: например, `--bizon-coral-500` и `--bizon-coral-600` — два явно заданных значения. CSS выбирает нужный токен по назначению или состоянию элемента.

## Базовая палитра, используемая активными элементами

| Семейство | Образцы | Используемые токены и цвета | Назначение |
| --- | --- | --- | --- |
| Коралловый | <span title="#ea7a60" style="display:inline-block;width:1.1em;height:1.1em;background:#ea7a60;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> <span title="#e45433" style="display:inline-block;width:1.1em;height:1.1em;background:#e45433;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> <span title="#c93b1b" style="display:inline-block;width:1.1em;height:1.1em;background:#c93b1b;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> | `--bizon-coral-400` `#ea7a60`; `--bizon-coral-500` `#e45433`; `--bizon-coral-600` `#c93b1b` | CTA, ссылки, kicker, активные и hover-состояния, сообщения о недоступном варианте. |
| Мятный | <span title="#44eace" style="display:inline-block;width:1.1em;height:1.1em;background:#44eace;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> <span title="#06e3be" style="display:inline-block;width:1.1em;height:1.1em;background:#06e3be;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> <span title="#05c1a2" style="display:inline-block;width:1.1em;height:1.1em;background:#05c1a2;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> <span title="#04947c" style="display:inline-block;width:1.1em;height:1.1em;background:#04947c;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> | `--bizon-mint-400` `#44eace`; `--bizon-mint-500` `#06e3be`; `--bizon-mint-600` `#05c1a2`; `--bizon-mint-700` `#04947c` | Индикатор наличия, интерактивные акценты, включённый переключатель, отдельные ярлыки. |
| Нейтральный | <span title="#f5f5f5" style="display:inline-block;width:1.1em;height:1.1em;background:#f5f5f5;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> <span title="#e9e9e9" style="display:inline-block;width:1.1em;height:1.1em;background:#e9e9e9;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> <span title="#b5b5b5" style="display:inline-block;width:1.1em;height:1.1em;background:#b5b5b5;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> <span title="#696969" style="display:inline-block;width:1.1em;height:1.1em;background:#696969;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> <span title="#363636" style="display:inline-block;width:1.1em;height:1.1em;background:#363636;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> <span title="#1c1c1c" style="display:inline-block;width:1.1em;height:1.1em;background:#1c1c1c;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> <span title="#232323" style="display:inline-block;width:1.1em;height:1.1em;background:#232323;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> | `--bizon-neutral-50` `#f5f5f5`; `--bizon-neutral-100` `#e9e9e9`; `--bizon-neutral-300` `#b5b5b5`; `--bizon-neutral-600` `#696969`; `--bizon-neutral-800` `#363636`; `--bizon-neutral-900` `#1c1c1c`; `--bizon-neutral-950` `#232323` | Мягкие поверхности, рамки, muted-текст, основной текст и тёмные градиенты. |
| Светлая/тёмная база | <span title="#fafafa" style="display:inline-block;width:1.1em;height:1.1em;background:#fafafa;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> <span title="#ffffff" style="display:inline-block;width:1.1em;height:1.1em;background:#ffffff;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> <span title="#000000" style="display:inline-block;width:1.1em;height:1.1em;background:#000000;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> | `--bizon-polar` `#fafafa`; `--bizon-white` `#ffffff`; `--bizon-black` `#000000` | Фон страницы/карточек, контрастный текст, инверсные кнопки и маски иконок. |
| Ошибка | <span title="#b42318" style="display:inline-block;width:1.1em;height:1.1em;background:#b42318;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> | `--bizon-danger` `#b42318` | Текст и состояния ошибок через `--color-destructive`. |

Квадраты встроены как HTML-образцы. Если просмотрщик Markdown скрывает HTML-стили, рядом с каждым образцом остаётся его hex-код.

Активные палитровые цвета перечислены по использованию в текущих публичных стилях, а не по наличию определения в шкале.

### Контекстные поверхности и фирменные цвета

| Токен и образец | Токен и образец |
| --- | --- |
| `--color-brand-doloto` `#c8a96e` <span style="display:inline-block;width:1.1em;height:1.1em;background:#c8a96e;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> | `--color-footer-cream` `#f7f5f0` <span style="display:inline-block;width:1.1em;height:1.1em;background:#f7f5f0;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> |
| `--color-surface-home-dark` `#101313` <span style="display:inline-block;width:1.1em;height:1.1em;background:#101313;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> | `--color-surface-near-black` `#111111` <span style="display:inline-block;width:1.1em;height:1.1em;background:#111111;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> |
| `--color-overlay-photo` `#080a0a` <span style="display:inline-block;width:1.1em;height:1.1em;background:#080a0a;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> | `--color-overlay-main` `#080a0c` <span style="display:inline-block;width:1.1em;height:1.1em;background:#080a0c;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> |
| `--color-overlay-cinematic` `#050707` <span style="display:inline-block;width:1.1em;height:1.1em;background:#050707;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> | `--color-overlay-shop` `#0a0c0c` <span style="display:inline-block;width:1.1em;height:1.1em;background:#0a0c0c;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> |
| `--color-overlay-card` `#141616` <span style="display:inline-block;width:1.1em;height:1.1em;background:#141616;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> | `--color-overlay-category` `#121515` <span style="display:inline-block;width:1.1em;height:1.1em;background:#121515;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> |
| `--color-glass-light` `#f8f9f8` <span style="display:inline-block;width:1.1em;height:1.1em;background:#f8f9f8;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> | `--color-scrim-cool` `#0a0e12` <span style="display:inline-block;width:1.1em;height:1.1em;background:#0a0e12;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> |
| `--color-switch-off-start` `#b3b3b3` <span style="display:inline-block;width:1.1em;height:1.1em;background:#b3b3b3;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> | `--color-switch-off-end` `#e6e6e6` <span style="display:inline-block;width:1.1em;height:1.1em;background:#e6e6e6;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> |
| `--color-surface-inverse` `#0a0a0a` <span style="display:inline-block;width:1.1em;height:1.1em;background:#0a0a0a;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> | `--color-surface-inverse-muted` `#101010` <span style="display:inline-block;width:1.1em;height:1.1em;background:#101010;border:1px solid #777;border-radius:3px;vertical-align:middle"></span> |

## Семантические токены и элементы

| CSS-токен | На что назначается | Как выбирается цвет |
| --- | --- | --- |
| `--color-primary` → `--color-accent-coral` → coral-500 | `.btn-accent`, `.cart-badge`, `.skip-link:focus`, основные кнопки каталога и магазина | Основное действие — стандартный коралловый `#e45433`; текст поверх — белый (`--color-on-primary`). |
| `--color-primary-dark` → coral-600 | Hover у `.btn-accent` | Кнопка темнеет до `#c93b1b`, чтобы отличаться от обычного состояния. |
| `--color-link` → coral-600; `--color-link-hover` → coral-500 | Ссылки, переходы, стрелки и focus-контуры в каталоге, Tire IQ и контентных страницах | Ссылка обычно темнее; hover становится ярче. Это отдельное правило, оно отличается от затемнения основной кнопки. |
| `--color-kicker` → coral-500 | `.eyebrow`, `.section-kicker`, подписи/метки над заголовками | В контексте `[data-brand-context="shop"]` меняется на coral-400 `#ea7a60`; оттенок зависит от контекста магазина. |
| coral-500 / coral-600 | Кнопки добавления в корзину, акцентные ссылки футера, активные маркеры; coral-600 — текст «вариант недоступен» в Shop Product Configurator | CTA/активная метка — 500; усиленный текст/состояние недоступности — 600. |
| `--color-foreground` → neutral-900 | Основной текст, заголовки, поля форм, основной текст карточек | Используется на светлой поверхности; поверх тёмной поверхности применяется `--color-on-dark`. |
| `--color-background` → polar; `--color-surface` → polar | Фон страницы и базовые поверхности карточек, форм, фильтров | Светлая почти белая основа `#fafafa`. |
| `--color-surface-muted` → neutral-50 | Вторичные панели, hover корзины, мягкие поверхности | Светло-серый фон `#f5f5f5`; в `.catalog-card` контекст магазина подставляет градиентный акцент. |
| `--color-border` → neutral-100; `--color-border-strong` → neutral-300 | Рамки карточек, полей, разделители; усиленная рамка при hover | Обычная рамка `#e9e9e9`, усиленная — `#b5b5b5`. Focus-ring ссылается на сильную рамку через `--color-ring`. |
| `--color-muted` / `--color-text-subtle` → neutral-600 | Вторичный текст, описания, подписи, placeholder-подобная информация | Приглушённый серый `#696969`; disabled-компоненты могут дополнительно снижать opacity. |
| `--color-destructive` → bizon-danger; `--color-destructive-foreground` → white | Ошибки форм и разрушительные действия в корзине | Ошибка получает красный `#b42318`; на красной заливке используется белый текст. |
| `--color-on-dark` → white; `--color-on-dark-muted/subtle/faint` | Текст и подписи в футере, тёмных hero/Shop-панелях | Белый остаётся базой, а визуальная иерархия строится прозрачностью: 100%, 72%, 62%, 45%. |
| `--color-surface-inverse` `#0a0a0a`; `--color-surface-inverse-muted` `#101010` | Инверсный фон, scroll-driven секция Shop, отдельные тёмные панели | Чёрный с оттенком для большой тёмной области; muted-вариант используется в Shop-поверхностях. Не заменять на чистый `#000000` без решения дизайна. |
| `--color-surface-near-black` `#111111`; `--color-surface-home-dark` `#101313` | Тёмные плитки преимуществ и блок брендинга; тёмный тон плавающей шапки | Эти оттенки сохранены отдельно, поскольку не совпадают с inverse-поверхностью. |
| `--color-brand-doloto` `#c8a96e`; `--color-footer-cream` `#f7f5f0` | Золотой hover и светлый текст/логотип Doloto в юридической строке футера | Локальная брендовая пара футера; не использовать как общие CTA-цвета BIZON. |

## Статусы и интерактивные состояния

| Элемент/состояние | Цвет | Зависимость |
| --- | --- | --- |
| `.availability-badge::before`, статус «в наличии» | mint-500 `#06e3be` | Статус доступности; мягкий ореол — тот же mint-500 с прозрачностью 22%. |
| `.availability-badge[data-status="on-order"]` | coral-500 `#e45433` | Атрибут `data-status="on-order"` меняет точку статуса и её ореол; текст становится muted. |
| `.availability` в Shop Product Configurator | mint-700 `#04947c` | Положительное подтверждение выбранной конфигурации. |
| `.unavailable`, текст о недоступной комбинации | coral-600 `#c93b1b` | Состояние недоступного варианта; это текстовое предупреждение, не destructive-ошибка формы. |
| `.optionGroup button[aria-pressed="true"]` | чёрный фон / белый текст | Состояние выбранного варианта товара. |
| `.optionGroup button:disabled`, disabled-кнопка добавления | neutral-600 текст, уменьшенная opacity; neutral-300 фон | Доступность элемента задаётся disabled-состоянием, а не цветом обычного действия. |
| `.btn-glass`, текстовые действия на фото | белый с opacity 20%; hover 30% | Стеклянная кнопка; читаемость поддерживается blur и контрастным фото-фоном. |
| `.btn-secondary--inverse` | белый с opacity 94%, белая рамка 42%; hover — сплошной белый | Инверсная кнопка на тёмном фоне. Текст чёрный. |
| `:focus-visible` | `--focus-outline` → `--color-ring` → neutral-300 | Клавиатурный фокус использует единый ring и offset, независимо от CTA-цвета. |
| `WheelOrderPanel` переключатель | off: градиент `#b3b3b3 → #e6e6e6`; on: mint-600 → mint-500 | Оттенок выбирается состоянием `input:checked`; бегунок белый. |

## Фото, стекло, тени и градиенты

Токены описывают базовый цвет слоя; процент в `color-mix()` определяет его плотность и остаётся частью конкретного визуального состояния.

| Токен базового слоя | Значение | Где применяется и от чего зависит итоговый оттенок |
| --- | --- | --- |
| `--color-overlay-photo` | `#080a0a` | Общий `--overlay-photo` на hero/фотоблоках главной, магазина, категории и карусели преимуществ. Направление градиента и alpha меняют затемнение по участкам кадра. |
| `--color-overlay-main` | `#080a0c` | Тени текста и hero-градиенты главной, плюс shop-home hero; итог зависит от позиции градиента поверх фотографии. |
| `--color-overlay-cinematic` | `#050707` | Многослойные hero/брендовые наложения главной; набор остановок и прозрачность зависят от конкретного кадра/адаптивного состояния. |
| `--color-overlay-shop` | `#0a0c0c` | Нижние градиенты shop-home и карусели преимуществ; сильнее затемняет область текста у нижнего края. |
| `--color-overlay-card` | `#141616` | Подложки поверх карточек/плиток в карусели преимуществ и витрине категорий; hover повышает плотность слоя. |
| `--color-overlay-category` | `#121515` | Стеклянная кнопка/действия в hero lifestyle-категории. |
| `--color-scrim-cool` | `#0a0e12` | Подложка backdrop мобильной панели фильтров; непрозрачность 58% затемняет страницу под drawer. |
| `--color-glass-light` | `#f8f9f8` | Светлый фон плавающей шапки: 88% цвета смешивается с прозрачностью; border — нейтральный с alpha 14%. |
| `--shadow-card`, `--shadow-floating` | neutral-900 с alpha 8% / 16% | Цвет теней карточек и плавающей навигации; геометрия тени задана рядом, цвет берётся из нейтрального токена. |
| `--gradient-campaign-placeholder`, `--gradient-shop-accent` | mint/coral с alpha поверх neutral-900 → neutral-950 → neutral-800 | Градиент-заглушка/акцент. В `[data-brand-context="shop"]` campaign placeholder заменяется на shop-accent. |

На реальную фотографию итоговый цвет зависит от исходного пикселя изображения, направления и точки градиента, прозрачности слоя, а также hover/адаптивного состояния. Поэтому такие оттенки не являются дополнительными сплошными цветами палитры.

## Контекст магазина и переключение темы

- Базовая тема сайта объявлена в `:root`: `color-scheme: light`, фон и карточки светлые, основной текст — neutral-900.
- Тёмные секции используют собственные роли: `--color-on-dark`, белые текстовые уровни и локальные overlay-токены. Это не переключение всей страницы в dark mode.
- `[data-brand-context="shop"]` задаёт kicker coral-400 и `--gradient-campaign-placeholder: var(--gradient-shop-accent)`; часть hover-состояний карточек получает мятное кольцо.
- `FloatingChrome` в обычном тоне имеет светлое стекло, тёмный текст и коралловый hover. При `data-tone="dark"` фон становится `#101313` с opacity 68%, текст и border переходят на полупрозрачный белый.
- Оттенок доступности задаёт состояние данных: `data-status="on-order"`, `aria-pressed="true"`, `disabled`, `:hover`, `:focus-visible`. Сами эти состояния не вычисляют цвет — они выбирают заранее заданный токен.

## Токены палитры без текущего потребителя

В `globals.css` сохранены ступени цветовых шкал для совместимости/будущего применения. По текущей статической проверке публичных CSS-файлов они не назначаются активным компонентам: coral `50/100/200/300/700/800/900`; mint `50/100/200/300/800/900`; neutral `200/400/500/700/surface`. Их значения: coral `#fffefe`, `#fcebe7`, `#f6c5ba`, `#f0a08d`, `#9c2e15`, `#6f210f`, `#421309`; mint `#f3fefc`, `#dafbf5`, `#b4f7ec`, `#83f1df`, `#036655`, `#023930`; neutral `#cfcfcf`, `#9c9c9c`, `#838383`, `#505050`, `#2c2c2c`.

Этот список означает «не используется активным CSS-компонентом», а не «удалён из репозитория». Внешний или CMS-authored HTML может обращаться к глобальным custom properties; перед удалением резервных токенов нужно отдельно проверить такой контент.

## Исключения и правила дальнейших изменений

- `@property` требует буквальный `initial-value`; CSS-переменную туда подставить нельзя. Поэтому белый и ink повторяются в регистрациях `--page-canvas`, `--page-ink`, `--home-canvas`, `--home-ink`.
- `layout.tsx` и `manifest.ts` передают цвета в метаданные/манифест как строки. Эти значения должны соответствовать white/neutral-900, но CSS `var()` туда не передаётся.
- Для нового CSS сначала выбирай ближайший семантический токен из `globals.css`. Если оттенок действительно новый и повторно используемый — добавь именованный токен в `:root`, затем используй `var(--token)` в компоненте.
- Не добавляй новый hex/rgb в модуль ради небольшого визуального отличия. Сначала реши, это новое семантическое состояние или уже существующий токен с правильной ролью.
- Не выравнивай все hover-состояния на один оттенок: первичная кнопка темнеет, ссылка светлеет, а карточка может менять alpha-overlay. Это разные роли, уже отражённые токенами/состояниями.
