import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function HomePage() {
  const [currentUser, teamCount, openScrimCount, tournamentCount] =
    await Promise.all([
      getCurrentUser(),
      prisma.team.count(),
      prisma.scrim.count({ where: { status: "OPEN" } }),
      prisma.tournament.count(),
    ]);

  // ดึงคิวซ้อมที่ยืนยันแล้วของทีมที่ผู้ใช้สังกัดอยู่
  const myTeamIds = currentUser?.memberships.map((m) => m.teamId) ?? [];
  const myConfirmedScrims =
    myTeamIds.length > 0
      ? await prisma.scrim.findMany({
          where: {
            status: "CONFIRMED",
            OR: [
              { hostTeamId: { in: myTeamIds } },
              { guestTeamId: { in: myTeamIds } },
            ],
          },
          include: {
            hostTeam: { select: { tag: true, name: true } },
            guestTeam: { select: { tag: true, name: true } },
          },
          orderBy: { startTime: "asc" },
          take: 4,
        })
      : [];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              E-Sports Management Platform
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-white pt-2">
              {currentUser
                ? `ยินดีต้อนรับ, ${currentUser.gamerTag}`
                : "Scrim & Bracket Manager"}
            </h1>
            <p className="text-zinc-400 max-w-2xl text-sm">
              ระบบจัดการทีม แชร์โค้ดชวนเพื่อนเข้า Roster นัดซ้อมแข่ง (Scrim)
              และรันสายการแข่งขันอัตโนมัติ
            </p>
          </div>

          {!currentUser && (
            <Link
              href="/login"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
            >
              เข้าสู่ระบบ / สมัครสมาชิก →
            </Link>
          )}
        </div>

        {/* ส่วนแสดงข้อมูลส่วนตัวเมื่อ Login แล้ว */}
        {currentUser && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ทีมของฉัน */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">
                  ทีมที่คุณสังกัด ({currentUser.memberships.length})
                </h2>
                <Link
                  href="/teams"
                  className="text-xs text-emerald-400 hover:underline"
                >
                  + สร้าง / จอยทีม
                </Link>
              </div>

              {currentUser.memberships.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4">
                  คุณยังไม่ได้สังกัดทีมใด กดไปที่เมนู Teams เพื่อสร้างทีมหรือใส่
                  Invite Code
                </p>
              ) : (
                <ul className="space-y-2">
                  {currentUser.memberships.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between bg-zinc-950 border border-zinc-800/80 rounded-lg px-3.5 py-2.5 text-xs"
                    >
                      <Link
                        href={`/teams/${m.team.id}`}
                        className="group flex items-center"
                      >
                        <span className="text-emerald-400 font-bold mr-1.5">
                          [{m.team.tag}]
                        </span>
                        <span className="text-zinc-200 font-medium group-hover:text-emerald-400 transition">
                          {m.team.name}
                        </span>
                      </Link>
                      <span className="text-[10px] text-zinc-500">
                        {m.role}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* คิวซ้อมที่กำลังจะมาถึง */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">
                  คิวซ้อมที่ยืนยันแล้ว ({myConfirmedScrims.length})
                </h2>
                <Link
                  href="/scrims"
                  className="text-xs text-indigo-400 hover:underline"
                >
                  ดูตารางซ้อม →
                </Link>
              </div>

              {myConfirmedScrims.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4">
                  ยังไม่มีนัดซ้อมที่ยืนยันในขณะนี้
                </p>
              ) : (
                <ul className="space-y-2">
                  {myConfirmedScrims.map((scrim) => (
                    <li
                      key={scrim.id}
                      className="flex items-center justify-between bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2 text-xs"
                    >
                      <span className="text-zinc-200 font-medium">
                        [{scrim.hostTeam.tag}] vs [{scrim.guestTeam?.tag}]
                      </span>
                      <span className="text-zinc-400">
                        {formatDateTime(scrim.startTime)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* เมนูหลัก 3 โมดูล */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/teams"
            className="group bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-xl p-6 transition flex flex-col justify-between space-y-6"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-400">
                  ทีมทั้งหมด
                </span>
                <span className="text-2xl font-bold text-white">
                  {teamCount}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-white group-hover:text-emerald-400 transition">
                Teams & Roster →
              </h2>
              <p className="text-sm text-zinc-400">
                สร้างทีมใหม่ จัดการตำแหน่งผู้เล่น และคัดลอก Invite Code
                ส่งให้เพื่อนเข้าทีม
              </p>
            </div>
          </Link>

          <Link
            href="/scrims"
            className="group bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 rounded-xl p-6 transition flex flex-col justify-between space-y-6"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-indigo-400">
                  ห้องซ้อมที่เปิดอยู่
                </span>
                <span className="text-2xl font-bold text-white">
                  {openScrimCount}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-white group-hover:text-indigo-400 transition">
                Scrim Finder →
              </h2>
              <p className="text-sm text-zinc-400">
                ลงประกาศหาคู่ซ้อม เลือก Map Pool
                และกดรับคำท้าพร้อมระบบเช็กเวลาซ้ำซ้อน
              </p>
            </div>
          </Link>

          <Link
            href="/tournaments"
            className="group bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 rounded-xl p-6 transition flex flex-col justify-between space-y-6"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-400">
                  ทัวร์นาเมนต์
                </span>
                <span className="text-2xl font-bold text-white">
                  {tournamentCount}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-white group-hover:text-amber-400 transition">
                Bracket Manager →
              </h2>
              <p className="text-sm text-zinc-400">
                สร้างสายการแข่งขัน Single Elimination
                บันทึกผลสกอร์และดันผู้ชนะเข้ารอบอัตโนมัติ
              </p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
