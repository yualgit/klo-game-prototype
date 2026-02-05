# External Integrations

**Analysis Date:** 2026-02-05

## APIs & External Services

**Firebase Suite:**
- **Firestore** - Primary data storage (users, progress, coupons)
  - SDK/Client: `@firebase/firestore`
  - Connection: Firebase project initialized via `firebase.json` config
- **Firebase Authentication** - User identity and session management
  - SDK/Client: `@firebase/auth`
  - Methods: Anonymous + phone verification
- **Firebase Analytics** - Game event tracking and user property monitoring
  - SDK/Client: `@firebase/analytics`
  - Env var: Not explicitly documented (Firebase project handles it)
- **Firebase Remote Config** - Server-side configuration management
  - SDK/Client: `@firebase/remote-config`
  - Parameters: `level_data`, `reward_frequency`, `coupon_types`, `booster_prices` (per `TECH_SPEC.md`)
- **Firebase Hosting** - PWA deployment and static asset serving
  - Configuration: `firebase.json` hosting section
- **Cloud Functions** - Serverless backend logic
  - Runtime: Node.js 18
  - Triggered via HTTPS callable endpoints

**KLO Business Integration:**
- **KLO Loyalty Backend** - Coupon redemption integration (future, not yet implemented)
  - Connection: Expected via HTTP endpoints from Cloud Functions
  - Authentication: Not yet documented
  - Data flow: `coupon_id` → KLO backend → station verification → receipt tracking

## Data Storage

**Databases:**
- **Firestore (NoSQL)**
  - Connection: Firebase project context
  - Client: `@firebase/firestore`
  - Collections:
    - `users` - User profiles, progress, booster inventory, stats
    - `coupons` - Active/redeemed coupons with expiration and redemption tracking

**File Storage:**
- **Firebase Storage (optional)** - Planned for graphics and audio assets
  - Status: Not yet implemented (noted as "opційно" in `TECH_SPEC.md`)

**Game Data:**
- **JSON files** - Level definitions (committed to repo)
  - Location: `data/levels/*.json` (original) and `public/data/levels/` (build artifacts)
  - Format: Defined schema in `TECH_SPEC.md` with 5 levels (level_001.json through level_005.json)

## Authentication & Identity

**Auth Provider:**
- **Firebase Authentication**
  - Implementation: Multi-step authentication
    1. Anonymous auth for initial gameplay
    2. Phone verification (E.164 format) to bind to loyalty_id
    3. Loyalty card linking to KLO system
  - Antifraud: Device ID tracking via Firebase Installation ID, IP-based limits per `TECH_SPEC.md`

## Monitoring & Observability

**Error Tracking:**
- Firebase Crashlytics - Not explicitly documented but available via Firebase suite

**Logs:**
- Firebase Analytics events - Primary observability method
- Cloud Functions logs - Available in Firebase Console

**Analytics Events (per `TECH_SPEC.md`):**
- Game events: `level_start`, `level_win`, `level_fail`, `level_retry`, `booster_used`, `combo_triggered`
- Reward events: `reward_shown`, `coupon_claimed`, `coupon_redeemed` (key for KPI #2)
- Session events: `session_start`, `session_end`, `tutorial_step`
- Card events: `card_shown`, `mission_completed`

**User Properties:**
- `loyalty_id`, `total_levels_completed`, `total_coupons_claimed`, `total_coupons_redeemed`

## CI/CD & Deployment

**Hosting:**
- Firebase Hosting - PWA platform for prototype
- Custom domain: TBD (Firebase provides default domain)

**CI Pipeline:**
- Not yet configured
- Manual deployment via `firebase deploy` command
- `firebase deploy --only hosting` (frontend)
- `firebase deploy --only functions` (Cloud Functions)
- `firebase deploy --only firestore:rules` (security rules)

## Environment Configuration

**Required env vars:**
- Firebase project credentials (handled by `.firebaserc` and `firebase.json`)
- FIREBASE_CONFIG - Project configuration
- Cloud Functions runtime config - Not yet documented

**Secrets location:**
- `.firebaserc` - Stores Firebase project reference (committed)
- `functions/.env` - Not yet created (for sensitive Cloud Functions config if needed)
- Firebase Console - Secrets Manager for sensitive data (if implemented)

## Webhooks & Callbacks

**Incoming:**
- Cloud Functions HTTPS endpoints for:
  - `generateCoupon` - Called by frontend after level win
  - `redeemCoupon` - Called by KLO station/cash register system (future)

**Outgoing:**
- Analytics event firing to Firebase Analytics
- Coupon redemption notification to KLO backend (future integration)
- Receipt tracking: `coupon_id` → `receipt_id` → product category attribution

## Data Flow: Coupon Generation & Redemption

**Generate Coupon:**
1. Frontend calls Cloud Function `generateCoupon` with `user_id`, `level_id`, `coupon_type`
2. Function validates:
   - User coupon limits (per `TECH_SPEC.md`: max X coupons/week per category)
   - Campaign budget remaining (aggregate Firestore query)
   - Antifraud patterns (device limits, IP rate limiting, suspicious activity)
3. Function generates unique `coupon_id` and stores in Firestore `coupons` collection
4. Frontend receives coupon and logs `coupon_claimed` event
5. User stores coupon (local or can view later from profile)

**Redeem Coupon:**
1. User presents coupon at KLO station (QR code or text code `KLO-AB12CD`)
2. Station POS system or KLO backend calls Cloud Function `redeemCoupon` with `coupon_id`, `station_id`, `receipt_id`, `product_id`
3. Function validates:
   - Coupon exists and not expired
   - Status is `active` (not already redeemed)
   - `user_id` vs `loyalty_id` match
4. Function updates coupon status to `redeemed` and logs timestamp + station/receipt info
5. Analytics event `coupon_redeemed` fires with redemption metadata
6. Discount applied at point of sale
7. Receipt data flows to KLO backend for category sales attribution

## Security & Antifraud Mechanisms

**Firestore Security Rules:**
- Not yet documented but required per `TECH_SPEC.md`
- Must enforce: User can only read/write their own data
- Functions have elevated permissions for validation

**Antifraud Checks (per `TECH_SPEC.md`):**
1. **Device tracking** - Firebase Installation ID + device_id
   - Max 1 new account per day per device
   - Blocks new registrations if > 5 accounts per hour from one IP
2. **Activity pattern detection**
   - 100 levels in 2 hours → flagged as bot
   - 0% redemption rate → flagged as fraud
   - Rapid fail-then-win pattern → flagged as cheating
3. **Coupon binding**
   - Each `coupon_id` unique and linked to `user_id`
   - Redemption requires matching `loyalty_id`
   - TTL: 7–14 days expiration

## Remote Configuration

**Firebase Remote Config Parameters (per `TECH_SPEC.md`):**
- `level_data` - JSON array of level definitions (allows updates without app release)
- `reward_frequency` - Probability of coupon drops
- `coupon_types` - Active coupon categories and values
- `booster_prices` - If monetization added later
- A/B test variants - For reward frequency experimentation

**Update Flow:**
1. Product team updates Remote Config in Firebase Console
2. Frontend fetches config on app load (cached with TTL)
3. Game logic uses config values to determine reward drops and level data

---

*Integration audit: 2026-02-05*
