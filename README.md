# WK Workout Tracker v7
### Military Hardcore UI · PWA · Offline-First · IndexedDB

---

## Deploy บน GitHub Pages (ทำครั้งเดียว)

### 1. สร้าง Repo
```
github.com/new → ชื่อ: wk-workout-tracker → Public → Create
```

### 2. Push code
```bash
unzip wk-v7-military-hardcore-full.zip
cd wk-merged

git init
git add .
git commit -m "WK v7 Military Hardcore"
git remote add origin https://github.com/YOUR_USERNAME/wk-workout-tracker.git
git push -u origin main
```

### 3. เปิด GitHub Pages
```
Settings → Pages → Source: GitHub Actions → Save
```

### 4. แก้ base path ใน .github/workflows/deploy.yml
```yaml
      - name: Build
        run: npm run build
        env:
          VITE_BASE: /wk-workout-tracker/   # ← ชื่อ repo คุณ
```
Push อีกครั้ง → deploy อัตโนมัติ ~2 นาที

### 5. Add to Home Screen (iOS)
```
Safari → เปิด URL → Share → Add to Home Screen → Add
```

---

## Run Locally
```bash
npm install
npm run dev        # http://localhost:5173
npm run type-check # tsc --noEmit (0 errors ✓)
npm run build      # production build → dist/
```

---

## สิ่งที่แก้แล้วในเวอร์ชันนี้

| Bug | สถานะ |
|-----|-------|
| window.* handlers ใน Vite module mode | ✅ แก้แล้ว |
| Cross-domain import (planning → strength) | ✅ แก้แล้ว — ใช้ eventBus แทน |
| Lazy imports (load ทุก panel พร้อมกัน) | ✅ แก้แล้ว — dynamic import() จริง |
| localStorage 5MB limit + iOS 7-day clear | ✅ แก้แล้ว — IndexedDB |
| TypeScript errors | ✅ 0 errors |

---

## Architecture

```
index.html  (HTML shell + Military Hardcore CSS)
    │
    └── src/app/app.ts  (entry — window.* bridge + lazy loader)
            │
            ├── eventBus.ts         (pub/sub — cross-domain comms)
            │
            ├── core/store.ts       (single source of truth)
            ├── core/rootReducer.ts (combines all domain reducers)
            │
            ├── infra/storage.ts    ← IndexedDB (ไม่ใช่ localStorage แล้ว)
            ├── infra/persistence.ts
            ├── infra/migrations.ts (v1→v7 schema migration)
            │
            └── domains/
                ├── strength/   (Workout · History · Dashboard · Preset · Import)
                ├── endurance/  (Run · Swim · Interval)
                ├── military/   (Standards · FitTest · Programs · BodyCheck)
                ├── planning/   (Planner · Countdown)
                ├── recovery/   (Readiness)
                └── profile/    (Profile)
```

---

## Navigation Structure

```
Bottom Tab Bar (5 tabs)
├── 🏋️ Workout
├── 📊 Sitrep (Dashboard)
├── ⚔️ Military
├── 🏃 Endure (Run/Swim/Interval)
└── ◈ More
    ├── History
    ├── Programs (Presets)
    ├── Smart Planner
    ├── Countdown
    ├── Daily Readiness
    ├── Import
    ├── Export/Backup
    └── Profile
```
