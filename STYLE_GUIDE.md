# KLO Match-3 — Style Guide

**Версія:** 1.0  
**Дата:** 2026-02-05  
**Референси:** https://www.pinterest.com/atakaataka/klo-game/

---

## 🎨 Загальне відчуття / арт-напрям

**Genre look:** Modern casual match-3 (Royal Match / Candy-like).  
**Mood:** "Приємно-смачно-яскраво", але контрольовано; дружній, не дитсадок.  
**Readability first:** Великі форми, високий контраст, прості силуети.  
**Materials:** "Soft 3D / 2.5D" — легка об'ємність, глянець, м'які тіні.

**Відчуття:** Преміум-казуал match-3 у дусі топселлерів: "іграшковий", глянцевий, суперчитабельний, але без бруду й дрібних деталей.

---

## 🟨 Бренд KLO

### Кольори бренду
- **Основний:** Жовто-помаранчевий (warm yellow/orange) — KLO signature
  - Hex: `#FFB800` (яскравий жовтий)
  - Hex: `#FF9500` (помаранчевий акцент)
- **Додатковий:** Темно-сірий / чорний (для контрасту, логотипу)
  - Hex: `#2C2C2C`
- **Акценти:** Синій (для UI елементів, іконок)
  - Hex: `#0077FF`

### Філософія KLO
- **Сучасність:** КЛО — це сучасна, технологічна мережа АЗК (не старий совковий стиль).
- **Зручність:** Фокус на сервіс, швидкість, комфорт водія.
- **Довіра:** Прозорість, чесні ціни, якість.
- **Тепло:** Дружній, але професійний підхід (не холодний корпоратив).

### Як це виглядає в грі
- **Палітра гри** використовує жовто-помаранчеві відтінки як акцент (не домінанта, щоб не перевантажити).
- **Фішки/бустери** мають м'яку інтеграцію бренд-кольору (наприклад, паливна крапля — жовта з помаранчевим градієнтом).
- **UI елементи** (кнопки, прогрес-бари) — чисті, з КЛО-кольорами, але не "кричущі".
- **Загальний вайб:** преміум-казуал з легким натяком на KLO (логотип, кольори), але гра не виглядає як "реклама АЗК" — це в першу чергу **класна гра**, а потім уже KLO.

---

## 🎨 Палітра / світло

### Фони
- **Світлі/пастельні** або чисті градієнти
- Інколи **"тепле світло"** як у магазині/кафе
- Ніколи не темні/похмурі

### Акценти (тайли, бустери, UI)
- Насичені "цукеркові" кольори:
  - **Cyan/Blue** — `#00D4FF`
  - **Green** — `#00FF88`
  - **Red/Pink** — `#FF3366`
  - **Yellow/Orange** (KLO) — `#FFB800`, `#FF9500`
  - **Purple** — `#AA00FF`

### Освітлення
- М'яке "студійне", зверху-зліва
- Спекулярний блиск на тайлах (glossy highlight)
- Тіні: короткі, розмиті, під кожним елементом для відриву від фону

---

## 🧩 Тайли (Match-3 Pieces)

### Форма
- **Округлі, "пухкі"**, без гострих кутів
- Простий іконічний силует + 1–2 внутрішні деталі (полоска/іконка/виріз)

### Рендер
- Глянцевий **пластик/желе**
- Невеликий **highlight** (спекулярний блиск)
- Subtle **rim light** (світлий контур)
- Soft **shadow** знизу

### Розмір/пропорції
- Тайли мають виглядати "смачними" і **однаково вагомими**
- Поле читається з першого погляду

### Конкретні тайли для KLO

#### 1. Паливо (Fuel Drop)
- **Форма:** Крапля палива (tear drop shape)
- **Колір:** Жовтий → помаранчевий градієнт (`#FFD700` → `#FF9500`)
- **Деталі:** Маленький блиск зверху, м'який градієнт
- **Асоціація:** бензин, енергія, рух

#### 2. Кава (Coffee Cup)
- **Форма:** Стилізований стакан кави з кришкою (to-go cup)
- **Колір:** Коричневий + білий (крем-топ), `#6F4E37` + `#FFFFF0`
- **Деталі:** Пара (3 маленьких хмарки зверху), лого KLO на стакані (опційно)
- **Асоціація:** кав'ярня на АЗК, бадьорість

#### 3. Снеки (Snack Pack)
- **Форма:** Упаковка чіпсів або батончик
- **Колір:** Яскраво-червоний або зелений (`#FF3366` або `#00FF88`)
- **Деталі:** Простий патерн на упаковці (смужки/зірочки)
- **Асоціація:** їжа в дорогу, магазин на АЗК

#### 4. Дорога (Road Sign / Highway)
- **Форма:** Дорожній знак (круглий або трикутний) або стилізований асфальт
- **Колір:** Синій + білий (`#0077FF` + `#FFFFFF`)
- **Деталі:** Іконка дороги або стрілка "вперед"
- **Асоціація:** траса, подорож, логістика

---

## 🚀 Бустери (Special Pieces)

### 1. Лінійний бустер (Linear Booster)
- **Вигляд:** Тайл з **вертикальною або горизонтальною стрілкою** всередині
- **Колір:** Яскраво-білий/срібний з кольоровим акцентом (залежно від типу тайлу)
- **VFX:** При активації — **лінія світла** прориває ряд/колонку
- **Промпт:** *"Match-3 booster tile with vertical arrow inside, glossy white/silver shell, bright neon accent, soft 3D, high readability"*

### 2. Бомба (Bomb)
- **Вигляд:** Округла бомба з коротким фітилем (cartoon bomb)
- **Колір:** Чорний корпус + червоний фітіль (`#2C2C2C` + `#FF3366`)
- **VFX:** Вибух 3×3 з конфеті/іскорками
- **Промпт:** *"Cartoon bomb booster for match-3, round black body, red fuse, glossy soft 3D, isolated PNG"*

### 3. Ракета (Rocket)
- **Вигляд:** Маленька ракета (вертикальна або горизонтальна)
- **Колір:** Жовто-помаранчевий корпус + червоний вогонь (`#FFB800` + `#FF5500`)
- **VFX:** Летить у напрямку, знищує хрест (ряд + колонка)
- **Промпт:** *"Small rocket booster for match-3 game, yellow-orange body, red flames, soft 3D, glossy highlights"*

### 4. KLO-сфера (KLO Sphere / Color Bomb)
- **Вигляд:** Сфера з логотипом KLO або абстрактним патерном
- **Колір:** Жовто-помаранчевий з райдужним ефектом (`#FFB800` + holographic shimmer)
- **VFX:** Вибух, що знищує всі тайли одного типу (з ефектом хвилі)
- **Промпт:** *"Premium match-3 color bomb, glowing sphere with KLO branding, holographic shimmer, soft 3D, high-end casual game asset"*

---

## 🧊 Перешкоди / Об'єкти рівня

### 1. Лід (Ice Block)
- **Вигляд:** Прозора блакитна крига з тріщинами-патерном
- **Колір:** Світло-блакитний + білі блики (`#A0E7FF` + `#FFFFFF`)
- **Шари:** 1–3 шари (візуально товщі = більше шарів)
- **VFX:** Красиво ламається при знищенні (шматочки з блиском)
- **Промпт:** *"Ice block obstacle for match-3, transparent light blue, crack pattern, glossy highlights, soft 3D, isolated PNG with shadow"*

### 2. Бруд (Dirt / Sticky Oil)
- **Вигляд:** Темна напівпрозора пляма з блиском (не реалістичний бруд, а стилізований)
- **Колір:** Темно-коричневий або чорний з глянцем (`#3C2F2F` + `#666666`)
- **VFX:** Зникає з легким "пуф"-ефектом
- **Промпт:** *"Stylized dirt/oil obstacle for casual match-3, dark semi-transparent blob, glossy highlights, soft 3D, simple clean design"*

### 3. Ящик (Crate / Box)
- **Вигляд:** Дерев'яний або картонний ящик
- **Колір:** Теплий коричневий (`#8B5A3C`) з простими текстурами (дошки)
- **Шари:** 2–3 удари (візуально: тріщини після першого удару)
- **VFX:** Ламається на шматки з легким "тріском"
- **Промпт:** *"Wooden crate obstacle for match-3, warm brown, simple wood grain texture, soft 3D, clean stylized design, isolated PNG"*

### 4. Заблокована клітинка (Blocked Cell)
- **Вигляд:** Темна/сіра плитка з іконкою "заборонено" або просто пуста
- **Колір:** Темно-сірий (`#444444`)
- **Промпт:** *"Blocked grid cell for match-3, dark gray tile, simple flat design, subtle texture"*

---

## 🎴 Падаючі об'єкти / Доставка (Delivery Tokens)

### 1. Каністра (Fuel Canister)
- **Вигляд:** Маленька жовта каністра (cartoon style)
- **Колір:** Жовтий + чорна ручка (`#FFB800` + `#2C2C2C`)
- **Деталі:** Лого KLO на боці (опційно)
- **Промпт:** *"Small fuel canister token for match-3, yellow body, black handle, cartoon style, soft 3D, glossy highlights"*

### 2. Кавовий стакан (Coffee To-Go)
- **Вигляд:** Той самий, що й тайл кави, але трохи більший
- **Колір:** Коричневий + білий (`#6F4E37` + `#FFFFF0`)
- **Промпт:** *"Coffee cup delivery token, brown cup with white lid, steam, soft 3D, casual game asset"*

### 3. Пакунок з магазину (Shopping Bag)
- **Вигляд:** Стилізований паперовий пакет з ручками
- **Колір:** Білий або крафтовий коричневий (`#F5F5DC`)
- **Деталі:** Лого KLO або просто чистий
- **Промпт:** *"Shopping bag delivery token for match-3, paper bag with handles, clean minimal design, soft 3D"*

---

## 🖥️ UI / HUD

### Компоненти

**Верхній HUD:**
- Moves left (кількість ходів)
- Goals (цілі рівня: іконки + прогрес)
- Lives (якщо є система життів)

**Нижній HUD:**
- Бустери (pre-level boosters або in-game)
- Пауза / Налаштування

### Кнопки
- **Форма:** Великі pill/rounded (закруглені прямокутники)
- **Стиль:** Градієнт + глянець + м'яка тінь
- **Колір:** KLO жовто-помаранчевий для primary кнопок, сірий для secondary
- **Промпт:** *"Mobile casual game UI button, rounded rectangle, yellow-orange gradient, glossy highlight, subtle drop shadow, no text, isolated PNG"*

### Контейнери / Картки
- **Форма:** "Карточки" з округленням (border-radius: 20–30px)
- **Фон:** Білий/світлий (`#FFFFFF` або `#F9F9F9`)
- **Тінь:** Легка тінь для глибини (`box-shadow: 0 4px 12px rgba(0,0,0,0.1)`)
- **Промпт:** *"Mobile game UI card container, rounded rectangle, white background, soft drop shadow, clean minimal design"*

### Типографіка
- **Шрифт:** Товстий rounded sans (на кшталт **Nunito**, **Fredoka**, **Baloo**)
- **Розмір:** Великі цифри, мінімум тексту
- **Колір:** Темний для читабельності (`#2C2C2C`) або білий на темному фоні
- **Обводка (stroke):** Товста біла обводка на темному тексті для читабельності на різних фонах

### Іконки
- **Стиль:** Прості, з контуром або тінню, без тонких ліній
- **Колір:** Яскраві, контрастні
- **Промпт:** *"Simple game UI icon, clean silhouette, bold outline, vibrant color, high readability, isolated PNG"*

---

## 🗺️ Мета-мапа / Прогресія

### Map Style
- **Вигляд:** "Іграшкова діорама" (2.5D) — містечко/маршрут, чекпоінти-рівні як круглі кнопки
- **Декор:** Милі об'єкти (дерева, машинки, будиночки), але не перевантажено; багато "повітря"
- **Фон:** Світлий, чистий, з легким градієнтом неба

### Чекпоінти (Level Buttons)
- **Форма:** Великі круглі кнопки з номером рівня всередині
- **Колір:** Жовто-помаранчевий для активного рівня, сірий для locked, зелений для completed
- **Стиль:** Злегка підняті над поверхнею (тінь/глибина)
- **Промпт:** *"Match-3 level checkpoint button, large round, yellow-orange for active, number inside, soft 3D, glossy highlights, slight elevation shadow"*

### Декор
- **АЗК KLO (Станція):** Маленька стилізована заправка (кожні 10 рівнів)
  - **Промпт:** *"Toy-like gas station building for match-3 map, clean shapes, KLO branding, soft 3D, diorama style, isolated PNG"*
- **Дорога:** Стилізована траса, що з'єднує чекпоінти
- **Машинки:** Маленькі cartoon-авто на дорозі
- **Дерева/кущі:** Прості, округлі форми

---

## ✨ VFX / Анімації

### Вибухи (Explosions)
- **Стиль:** Конфеті/іскорки/зірочки, коротко і чисто
- **Колір:** Яскраві, різнокольорові
- **Тривалість:** 0.3–0.5 сек

### Комбо (Combo)
- **Ефект:** Сильніший спалах + screen shake + "whoosh" звук
- **Візуал:** Хвилі світла, які розходяться від епіцентру

### Win/Lose
- **Win:** Великі слова "VICTORY!" або "LEVEL COMPLETE", сяйво, конфеті, але без кислотного перевантаження
- **Lose:** "TRY AGAIN" або "ПОЧТИ!", м'який сірий фон, мотиваційний текст

### Transitions
- **Між рівнями:** Плавний fade або slide
- **Картки:** Slide-in з легким bounce

---

## 🎨 Ready-to-Use Prompts (для генерації асетів)

### A) Match-3 Tile (окремий тайл, PNG)

**Template:**
```
A premium casual match-3 game tile icon of [KLO_ITEM], 
soft 3D jelly/plastic look, rounded chunky shape, 
glossy highlights, subtle rim light, 
vibrant saturated color [COLOR], 
clean simple silhouette, no tiny details, 
soft shadow underneath, centered, 
isolated on transparent background, 
high readability, 1024x1024, game UI asset
```

**Negative:**
```
photorealistic, gritty texture, sharp edges, thin lines, text, watermark, busy background
```

**Приклади:**

#### Паливо (Fuel Drop)
```
A premium casual match-3 game tile icon of fuel drop, 
soft 3D jelly/plastic look, rounded tear drop shape, 
glossy highlights, subtle rim light, 
vibrant yellow-to-orange gradient (#FFD700 to #FF9500), 
clean simple silhouette, no tiny details, 
soft shadow underneath, centered, 
isolated on transparent background, 
high readability, 1024x1024, game UI asset
```

#### Кава (Coffee Cup)
```
A premium casual match-3 game tile icon of coffee to-go cup, 
soft 3D plastic look, rounded cup with lid, 
glossy highlights, subtle rim light, 
brown body (#6F4E37) with white cream top (#FFFFF0), 
3 small steam clouds above, 
clean simple silhouette, no tiny details, 
soft shadow underneath, centered, 
isolated on transparent background, 
high readability, 1024x1024, game UI asset
```

#### Снеки (Snack Pack)
```
A premium casual match-3 game tile icon of snack pack / chips bag, 
soft 3D plastic look, rounded rectangular shape, 
glossy highlights, subtle rim light, 
vibrant red color (#FF3366) with simple pattern, 
clean simple silhouette, no tiny details, 
soft shadow underneath, centered, 
isolated on transparent background, 
high readability, 1024x1024, game UI asset
```

#### Дорога (Road Sign)
```
A premium casual match-3 game tile icon of road sign / highway icon, 
soft 3D plastic look, round sign shape, 
glossy highlights, subtle rim light, 
vibrant blue (#0077FF) with white arrow forward, 
clean simple silhouette, no tiny details, 
soft shadow underneath, centered, 
isolated on transparent background, 
high readability, 1024x1024, game UI asset
```

---

### B) Obstacle (перешкода)

**Template:**
```
A casual match-3 obstacle asset: [OBSTACLE_TYPE], 
soft 3D, clean stylized textures, rounded corners, 
glossy highlights, [DETAILS], 
centered, isolated PNG with soft shadow, 
high readability, 1024x1024
```

**Приклади:**

#### Лід (Ice Block)
```
A casual match-3 obstacle asset: ice block, 
soft 3D, clean stylized textures, rounded corners, 
glossy highlights, transparent light blue (#A0E7FF) with white shine, 
crack pattern visible, 
centered, isolated PNG with soft shadow, 
high readability, 1024x1024
```

#### Ящик (Wooden Crate)
```
A casual match-3 obstacle asset: wooden crate, 
soft 3D, clean stylized wood grain texture, rounded corners, 
glossy highlights, warm brown (#8B5A3C), 
simple plank pattern, 
centered, isolated PNG with soft shadow, 
high readability, 1024x1024
```

#### Бруд (Dirt Blob)
```
A casual match-3 obstacle asset: sticky dirt blob, 
soft 3D, clean stylized semi-transparent, rounded organic shape, 
glossy highlights, dark brown (#3C2F2F) with subtle shine, 
centered, isolated PNG with soft shadow, 
high readability, 1024x1024
```

---

### C) UI Button / Card

**Template:**
```
Mobile casual game UI element: [ELEMENT_TYPE], 
rounded rectangle, soft gradient [COLOR], 
glossy highlight, subtle drop shadow, 
clean minimal style, premium casual match-3 UI, 
no text, isolated on transparent background, 
1024x512
```

**Приклади:**

#### Primary Button (KLO Yellow)
```
Mobile casual game UI element: primary button, 
rounded rectangle, soft gradient yellow-to-orange (#FFB800 to #FF9500), 
glossy highlight, subtle drop shadow, 
clean minimal style, premium casual match-3 UI, 
no text, isolated on transparent background, 
1024x512
```

#### Reward Card
```
Mobile casual game UI element: reward card container, 
rounded rectangle, white background (#FFFFFF), 
soft drop shadow (0 4px 12px rgba(0,0,0,0.1)), 
clean minimal style, premium casual match-3 UI, 
no text, isolated on transparent background, 
1024x1024
```

---

### D) Map Object (чекпоінт / станція)

**Template:**
```
2.5D casual game map object: [OBJECT_TYPE], 
toy-like diorama, clean shapes, soft shadows, 
vibrant but not noisy palette, 
high readability, isolated PNG, 1024x1024
```

**Приклади:**

#### Level Checkpoint (Active)
```
2.5D casual game map object: level checkpoint button, 
large round circle, yellow-orange color (#FFB800), 
toy-like diorama, clean shapes, soft shadows, 
number "5" inside (placeholder), 
high readability, isolated PNG, 1024x1024
```

#### KLO Gas Station (Станція)
```
2.5D casual game map object: small gas station building, 
toy-like diorama, clean shapes, KLO branding (yellow-orange), 
soft shadows, vibrant but not noisy palette, 
high readability, isolated PNG, 1024x1024
```

---

## 📐 Asset Specifications (технічні вимоги)

### Тайли (Match-3 Pieces)
- **Розмір:** 512×512 або 1024×1024 PNG
- **Формат:** PNG з прозорим фоном (alpha channel)
- **DPI:** 72 (web) або 144 (retina)
- **Shadow:** М'яка тінь "вбудована" в asset (не окремий шар)

### Перешкоди (Obstacles)
- **Розмір:** 512×512 або 1024×1024 PNG
- **Формат:** PNG з прозорим фоном
- **Шари:** Для багатошарових перешкод (лід 2-3 шари) — окремі PNG для кожного шару

### UI елементи
- **Кнопки:** 1024×512 PNG (широкий прямокутник)
- **Іконки:** 256×256 або 512×512 PNG
- **Картки:** 1024×1024 або 1024×1440 PNG

### VFX спрайти
- **Формат:** PNG sprite sheet або окремі frames
- **Розмір frame:** 256×256 або 512×512
- **FPS:** 30 fps для анімацій

---

## 🎨 Колірна палітра (повна)

### Основні кольори (тайли)
- **Fuel Yellow:** `#FFD700` → `#FF9500` (градієнт)
- **Coffee Brown:** `#6F4E37`
- **Coffee Cream:** `#FFFFF0`
- **Snack Red:** `#FF3366`
- **Road Blue:** `#0077FF`

### KLO бренд
- **KLO Yellow:** `#FFB800`
- **KLO Orange:** `#FF9500`
- **KLO Dark:** `#2C2C2C`

### UI кольори
- **Background Light:** `#F9F9F9`
- **Card White:** `#FFFFFF`
- **Text Dark:** `#2C2C2C`
- **Text Light:** `#FFFFFF`
- **Shadow:** `rgba(0, 0, 0, 0.1)` — `rgba(0, 0, 0, 0.3)`

### Перешкоди
- **Ice Blue:** `#A0E7FF`
- **Wood Brown:** `#8B5A3C`
- **Dirt Dark:** `#3C2F2F`
- **Blocked Gray:** `#444444`

### Акценти (для різноманітності)
- **Cyan:** `#00D4FF`
- **Green:** `#00FF88`
- **Pink:** `#FF3366`
- **Purple:** `#AA00FF`

---

## 🖼️ Референси

**Pinterest board:** https://www.pinterest.com/atakaataka/klo-game/

**Стиль подібний до:**
- Royal Match (Dreamgames)
- Candy Crush Saga (King)
- Homescapes / Gardenscapes (Playrix)
- Project Makeover (Magic Tavern)

**Ключові відмінності:**
- **Менш "дитячий"** — більш дорослий, преміум-вайб
- **KLO бренд** — жовто-помаранчеві акценти, логотип
- **Тематика дороги** — траси, АЗК, подорожі (не будиночки/сади)

---

## ✅ Checklist для дизайнера / AI-генерації

### Базові асети (пріоритет 1)
- [ ] 4 типи тайлів (Fuel, Coffee, Snack, Road) — по 1 варіанту кожен
- [ ] 4 типи бустерів (Linear, Bomb, Rocket, KLO Sphere)
- [ ] 3 типи перешкод (Ice 1-3 layers, Crate 2-3 layers, Dirt)
- [ ] Blocked cell (темна плитка)

### UI елементи (пріоритет 1)
- [ ] Primary button (жовто-помаранчевий)
- [ ] Secondary button (сірий)
- [ ] Reward card (білий контейнер)
- [ ] Progress bar (горизонтальний, з градієнтом)
- [ ] Іконки цілей (fuel, coffee, snack, road, ice, crate)

### Фони (пріоритет 2)
- [ ] Фон гри (світлий градієнт)
- [ ] Фон карти (діорама з дорогою)
- [ ] Фон win screen
- [ ] Фон lose screen

### Map objects (пріоритет 2)
- [ ] Level checkpoint (active, locked, completed)
- [ ] KLO Gas Station (чекпоінт кожні 10 рівнів)
- [ ] Дорога (path між рівнями)
- [ ] Декор (дерева, кущі, машинки)

### VFX (пріоритет 3)
- [ ] Match explosion (конфеті)
- [ ] Booster explosion (більше конфеті + спалах)
- [ ] Combo effect (хвилі світла)
- [ ] Win screen конфеті
- [ ] Ice break (шматочки льоду)
- [ ] Crate break (шматочки дерева)

---

**Версія:** 1.0  
**Автор:** Люм (Dev) + Вес (Product/AD)  
**Дата:** 2026-02-05  
**Статус:** ✅ Ready for asset generation
