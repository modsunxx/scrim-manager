# 🏆 Scrim & Bracket Manager

Full-Stack E-Sports Tournament & Scrim Platform สำหรับจัดการทีม นัดซ้อม (Scrim Finder) สร้างสายการแข่งขันแบบ Single Elimination และระบบแบน/เลือกแผนที่แบบสด (Live BO1/BO3 Map Veto & Side Selection)

## ✨ Key Features

- **Authentication & Role-Based Access Control (RBAC):**
  - ระบบสมัครสมาชิกและเข้าสู่ระบบด้วย JWT (`httpOnly` Cookie) และ `bcryptjs`
  - แยกสิทธิ์การใช้งานชัดเจนระหว่าง `USER`, `CAPTAIN` และ `ORGANIZER`
- **Team & Roster Management (`/teams`):**
  - สร้างทีม กำหนด Tag ประจำทีม และแชร์ **Invite Code** ให้สมาชิกกดเข้าร่วม
  - จัดการตำแหน่งผู้เล่น (`CAPTAIN`, `PLAYER`, `SUB`)
- **Team Profile & Statistics (`/teams/[id]`):**
  - แสดง Win Rate, จำนวนแชมป์ทัวร์นาเมนต์, สถิติแผนที่ที่ถนัดที่สุด และประวัติการแข่งขัน/การซ้อมย้อนหลัง
- **Scrim Finder (`/scrims`):**
  - ลงประกาศหาคู่ซ้อมพร้อมระบุ Map Pool และช่วงเวลา
  - ระบบตรวจสอบช่วงเวลาซ้ำซ้อน (Conflict Detection) อัตโนมัติเมื่อกดรับคำท้า
- **Tournament & Single Elimination Bracket (`/tournaments`):**
  - เปิดรับสมัครทีมเข้าแข่งขัน ตรวจสอบจำนวนผู้เล่นขั้นต่ำ และสุ่มจับคู่สายการแข่งขันอัตโนมัติ (4 หรือ 8 ทีม)
  - รองรับรูปแบบซีรีส์ `All BO1`, `Final BO3` และ `All BO3` พร้อมคำนวณผู้ชนะเข้าสู่รอบถัดไปจนถึงรอบชิงชนะเลิศ
- **Live Match Room & Map Veto (`/matches/[id]`):**
  - สลับคิวแบน/เลือกแผนที่ (Ban / Pick / Decider) ตามกติกา BO1 และ BO3
  - ระบบเลือกฝั่งเริ่มเกม (`CT / T` สำหรับ CS2 และ `Attack / Defense` สำหรับ Valorant)
  - แสดง Server IP / Lobby Code เฉพาะสมาชิกของทั้ง 2 ทีมที่แข่งขัน
  - **LiveSync Auto-Polling:** อัปเดตสถานะการแบนแผนที่และผลการแข่งขันข้ามหน้าจออัตโนมัติ

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, Server Actions, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database & ORM:** PostgreSQL + Prisma ORM
- **Authentication:** `jose` (JWT) + `bcryptjs`

## 🚀 Getting Started

### 1. Clone Repository & Install Dependencies

```bash
git clone https://github.com/modsunxx/scrim-manager.git
cd scrim-manager
npm install
```

### 2. Configure Environment Variables

สร้างไฟล์ `.env` ที่รูทของโปรเจกต์ และกำหนดค่าการเชื่อมต่อฐานข้อมูล PostgreSQL และ JWT Secret:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/scrim_manager?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this"
```

### 3. Run Database Migrations

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Start Development Server

```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```plaintext
├── app/
│   ├── actions/         # Server Actions (auth, team, scrim, tournament, match)
│   ├── login/           # หน้าเข้าสู่ระบบและสมัครสมาชิก
│   ├── matches/[id]/    # ห้องแข่งขัน, Live Map Veto, Side Selection และ Lobby Info
│   ├── scrims/          # ระบบลงประกาศและนัดซ้อมทีม
│   ├── teams/           # หน้ารวมทีม และหน้าโปรไฟล์สถิติทีม (/teams/[id])
│   └── tournaments/     # ระบบสมัครแข่งและสายการแข่งขัน Single Elimination
├── components/          # UI Components (Navbar, LiveSync)
├── lib/                 # Prisma Client, JWT Session และ Veto Logic
└── prisma/              # Database Schema และ Migrations
```
