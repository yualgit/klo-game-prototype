# KLO Match-3 — Технічна специфікація

**Версія:** 0.1 (прототип)  
**Дата:** 2026-02-05

---

## 🏗️ Архітектура

### Прототип (PWA, 1–2 тижні)

**Frontend:**
- **Framework:** Phaser 3 (рекомендовано) або pixi.js
- **Мова:** TypeScript
- **Build:** Vite або Webpack
- **Hosting:** Firebase Hosting

**Backend:**
- **Платформа:** Firebase
  - **Firestore:** дані юзерів, прогрес, купони
  - **Authentication:** анонімна + phone (прив'язка до loyalty_id)
  - **Analytics:** Firebase Analytics (всі події)
  - **Remote Config:** баланс рівнів, частота нагород, A/B тести
  - **Functions:** генерація/погашення купонів, антифрод
  - **Storage:** (опційно) для графіки/аудіо

**Match-3 Engine:**
- Готова бібліотека або open-source приклад з GitHub
- Базова логіка: grid 8×8, swap, match, gravity, spawn

---

## 📁 Структура проєкту

```
klo-match3/
├── package.json
├── tsconfig.json
├── vite.config.ts (або webpack.config.js)
├── firebase.json
├── .firebaserc
├── src/
│   ├── main.ts (entry point)
│   ├── scenes/
│   │   ├── Boot.ts (завантаження)
│   │   ├── Menu.ts (головне меню)
│   │   ├── Game.ts (ігрова сцена)
│   │   └── UI.ts (overlay UI)
│   ├── game/
│   │   ├── Grid.ts (8×8 grid manager)
│   │   ├── Tile.ts (фішка)
│   │   ├── Match.ts (логіка матчів)
│   │   ├── Booster.ts (бустери)
│   │   └── Obstacle.ts (перешкоди)
│   ├── data/
│   │   ├── LevelLoader.ts (завантаження JSON рівнів)
│   │   └── RemoteConfig.ts (Firebase Remote Config)
│   ├── firebase/
│   │   ├── auth.ts
│   │   ├── firestore.ts
│   │   ├── analytics.ts
│   │   └── functions.ts (виклик Cloud Functions)
│   └── utils/
│       ├── constants.ts
│       └── helpers.ts
├── public/
│   ├── index.html
│   ├── assets/ (графіка, звуки)
│   └── data/
│       └── levels/ (JSON рівні — копія з data/levels/)
├── functions/ (Firebase Cloud Functions)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── coupons.ts (generateCoupon, redeemCoupon)
│       └── antifraud.ts
└── data/
    └── levels/ (оригінальні JSON рівні)
```

---

## 🗂️ Формат даних

### Level JSON Schema

```typescript
interface Level {
  level_id: number;
  name: string;
  moves: number;
  grid: {
    width: number;
    height: number;
    blocked_cells: [number, number][]; // [x, y]
  };
  goals: Goal[];
  spawn_rules: {
    fuel: number;    // 0.0–1.0 (ймовірність spawn)
    coffee: number;
    snack: number;
    road: number;
  };
  obstacles: Obstacle[];
  tutorial?: {
    enabled: boolean;
    steps: string[];
  };
  rewards: {
    stars: number;
    boosters?: {
      linear?: number;
      bomb?: number;
      rocket?: number;
      sphere?: number;
    };
    coupon_chance?: number; // 0.0–1.0
    possible_coupons?: Coupon[];
  };
  difficulty: 'tutorial' | 'easy' | 'medium' | 'hard' | 'boss';
  target_fail_rate: number; // 0.0–1.0
}

interface Goal {
  type: 'collect' | 'destroy' | 'deliver' | 'create_booster';
  item?: string; // для 'collect'
  obstacle?: string; // для 'destroy'
  booster_type?: string; // для 'create_booster'
  count: number;
  description: string;
}

interface Obstacle {
  type: 'ice' | 'dirt' | 'crate' | 'blocked';
  layers?: number; // скільки разів треба вдарити
  positions: [number, number][];
  description?: string;
}

interface Coupon {
  id: string;
  category: 'coffee' | 'fuel' | 'market' | 'partner';
  value: string; // опис купона
  expires_days: number;
}
```

### Firestore Schema

**Collection: `users`**
```typescript
interface User {
  uid: string; // Firebase UID
  loyalty_id?: string; // KLO loyalty card ID (після прив'язки)
  phone?: string; // E.164 format
  created_at: Timestamp;
  last_seen: Timestamp;
  progress: {
    current_level: number;
    completed_levels: number[];
    stars: number;
  };
  boosters: {
    linear: number;
    bomb: number;
    rocket: number;
    sphere: number;
  };
  stats: {
    total_levels_completed: number;
    total_coupons_claimed: number;
    total_coupons_redeemed: number;
    total_sessions: number;
  };
}
```

**Collection: `coupons`**
```typescript
interface CouponDoc {
  coupon_id: string; // UUID або short code
  user_id: string; // Firebase UID
  loyalty_id?: string; // KLO loyalty ID
  category: 'coffee' | 'fuel' | 'market' | 'partner';
  value: string; // опис
  discount_amount?: number; // грн
  status: 'active' | 'redeemed' | 'expired';
  created_at: Timestamp;
  expires_at: Timestamp;
  redeemed_at?: Timestamp;
  station_id?: string;
  receipt_id?: string;
  product_id?: string;
}
```

---

## 🔥 Firebase Cloud Functions

### `generateCoupon`

**Trigger:** HTTPS callable  
**Input:**
```typescript
{
  user_id: string;
  level_id: number;
  coupon_type: string; // 'coffee_s_free', 'fuel_discount', etc.
}
```

**Logic:**
1. Перевірка лімітів юзера (Firestore query)
2. Перевірка загального бюджету кампанії (Firestore aggregate)
3. Антифрод чеки (device_id, IP, suspicious patterns)
4. Генерація унікального `coupon_id`
5. Збереження в Firestore collection `coupons`
6. Повернення купона юзеру

**Output:**
```typescript
{
  success: boolean;
  coupon?: CouponDoc;
  error?: string;
}
```

### `redeemCoupon`

**Trigger:** HTTPS callable (викликається з каси KLO або апки)  
**Input:**
```typescript
{
  coupon_id: string;
  station_id: string;
  receipt_id?: string;
  product_id?: string;
}
```

**Logic:**
1. Знайти купон у Firestore
2. Перевірити валідність (не expired, не redeemed, правильна категорія)
3. Перевірити `user_id` vs `loyalty_id` (якщо є)
4. Оновити статус на `redeemed`
5. Записати `redeemed_at`, `station_id`, `receipt_id`, `product_id`
6. Trigger аналітики (event `coupon_redeemed`)

**Output:**
```typescript
{
  success: boolean;
  discount_amount?: number;
  error?: string;
}
```

---

## 📊 Аналітика

### Firebase Analytics Events

**Формат:**
```typescript
analytics.logEvent('event_name', {
  level_id: number,
  param1: value,
  param2: value,
  ...
});
```

**Список подій:**

| Event                | Parameters                                      | Коли логується                       |
|----------------------|-------------------------------------------------|--------------------------------------|
| `level_start`        | `level_id`, `attempt_number`                    | Початок рівня                        |
| `level_win`          | `level_id`, `moves_left`, `time_spent`          | Перемога                             |
| `level_fail`         | `level_id`, `moves_used`, `fail_reason`         | Поразка                              |
| `level_retry`        | `level_id`                                      | Повтор рівня                         |
| `booster_used`       | `booster_type`, `level_id`                      | Використання бустера                 |
| `combo_triggered`    | `combo_type`, `level_id`                        | Комбінація бустерів                  |
| `reward_shown`       | `reward_type`, `level_id`                       | Показ нагороди                       |
| `coupon_claimed`     | `coupon_id`, `category`, `value`                | Отримання купона                     |
| `coupon_redeemed`    | `coupon_id`, `station_id`, `receipt_id`         | Погашення купона                     |
| `session_start`      | —                                               | Запуск гри                           |
| `session_end`        | `duration`                                      | Закриття гри                         |
| `tutorial_step`      | `step_number`, `step_name`                      | Проходження кроку туторіалу          |
| `card_shown`         | `card_type`, `card_id`                          | Показ картки між рівнями             |
| `mission_completed`  | `mission_id`, `mission_type`                    | Виконання місії                      |

### User Properties

```typescript
analytics.setUserProperties({
  loyalty_id: string,
  total_levels_completed: number,
  total_coupons_claimed: number,
  total_coupons_redeemed: number,
});
```

---

## 🔐 Антифрод

### Механізми

1. **Прив'язка до loyalty_id:**
   - Для отримання "реальних" купонів треба підтвердити телефон + прив'язати KLO loyalty card
   - Один `loyalty_id` = один акаунт

2. **Ліміти на device/IP:**
   - Firestore: зберігаємо `device_id` (Firebase Installation ID) + IP (з Cloud Functions)
   - Макс 1 новий акаунт/день з одного `device_id`
   - Якщо з одного IP >5 акаунтів за годину → блокуємо на 24 год

3. **Патерни підозрілої активності:**
   - 100 рівнів за 2 год → бот (автомодерація або ручна)
   - Redemption rate = 0% (клеймить купони, але ніколи не гасить) → фейк
   - Багато failed рівнів, потім раптово багато wins → читер

4. **Унікальні купони + TTL:**
   - Кожен `coupon_id` унікальний, прив'язаний до `user_id`
   - При погашенні перевірка: `user_id` купона == `loyalty_id` того, хто гасить
   - TTL: 7–14 днів, потім expired

5. **Ліміти на купони:**
   - Макс X купонів/тиждень на `user_id`
   - Загальний бюджет кампанії (Firestore aggregate)

---

## 🚀 Deployment (прототип)

### 1. Налаштування Firebase

```bash
npm install -g firebase-tools
firebase login
firebase init
# Вибрати: Hosting, Functions, Firestore, Storage
```

**firebase.json:**
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  }
}
```

### 2. Build & Deploy

```bash
# Build frontend
npm run build

# Deploy all
firebase deploy

# Або окремо
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

### 3. Remote Config

- Зайти в Firebase Console → Remote Config
- Додати параметри:
  - `level_data` (JSON string)
  - `reward_frequency` (number)
  - `coupon_types` (JSON array)
  - `booster_prices` (JSON object)

---

## 🧪 Testing

### Unit Tests
- Jest для логіки гри (Match, Grid, Booster)
- Firebase Emulator Suite для Functions

### Playtests
- 10+ людей для L1–20
- Metrics: fail rate, time per level, user feedback

### A/B Tests (через Remote Config)
- Variant A: купон кожні 5 рівнів
- Variant B: купон кожні 10 рівнів
- Metrics: redemption rate, revenue impact

---

## 📦 MVP (Unity, далі)

**Міграція з прототипу:**
- Той самий Firebase backend (безшовна міграція даних)
- Unity + Firebase SDK
- Готовий match-3 asset з Asset Store
- 100+ рівнів (генератор + ручна балансування)
- Повна інтеграція з касами KLO

**Timeline:**
- Прототип: 1–2 тижні
- MVP: 4–6 тижнів після прототипу
- Production: +2 тижні на тести + інтеграцію

---

**Версія:** 0.1 (прототип)  
**Автор:** Люм (Dev)  
**Дата:** 2026-02-05
