import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Thin horizontal divider used between HUD sections */
function HudDivider() {
  return <div className="h-px bg-zinc-800 w-full" />;
}

/** Uppercase tracked section label — craft-floor ban on kicker above h1 only; labels inside a section are fine */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-zinc-500 select-none">
      {children}
    </span>
  );
}

/** Stat block: label above, big mono number below */
function StatCell({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <SectionLabel>{label}</SectionLabel>
      <span
        className={`font-mono text-2xl font-bold leading-none tabular-nums tracking-tight ${
          accent ? "text-cyan-400" : "text-white"
        }`}
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        {value}
      </span>
    </div>
  );
}

/** Role badge — inline, no pill shape */
function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className="font-mono text-[10px] font-medium uppercase tracking-widest text-zinc-500"
      style={{ fontFamily: "var(--font-geist-mono)" }}
    >
      {role}
    </span>
  );
}

export default async function HomePage() {
  const [currentUser, teamCount, openScrimCount, tournamentCount] =
    await Promise.all([
      getCurrentUser(),
      prisma.team.count(),
      prisma.scrim.count({ where: { status: "OPEN" } }),
      prisma.tournament.count(),
    ]);

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
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ── TOP STATUS BAR ──────────────────────────────────────── */}
      <div className="border-b border-zinc-800 px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Pulse indicator */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          <span
            className="font-mono text-xs font-medium text-zinc-400 tracking-widest uppercase"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            SBM·HUD·v1
          </span>
        </div>
        <div className="flex items-center gap-6">
          {currentUser ? (
            <span
              className="font-mono text-xs text-zinc-400"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              <span className="text-cyan-400">{"//"}</span>{" "}
              {currentUser.gamerTag}
            </span>
          ) : (
            <Link
              href="/login"
              className="font-mono text-xs text-cyan-400 hover:text-cyan-300 tracking-widest uppercase transition-colors"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              [ เข้าสู่ระบบ ]
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        {/* ── MAIN HEADER ─────────────────────────────────────────── */}
        <div className="pt-10 pb-8">
          <h1 className="text-4xl font-bold tracking-tight text-white leading-none">
            Scrim &amp; Bracket
            <br />
            <span className="text-cyan-400">Manager</span>
          </h1>
          <p className="mt-3 text-sm text-zinc-500 max-w-sm leading-relaxed">
            จัดการทีม · นัดซ้อม Scrim · รันสายการแข่งขันอัตโนมัติ
          </p>
        </div>

        <HudDivider />

        {/* ── PLATFORM TELEMETRY ──────────────────────────────────── */}
        <div className="py-5 grid grid-cols-3 gap-0 divide-x divide-zinc-800">
          <div className="pr-8">
            <StatCell label="Teams Registered" value={teamCount} accent />
          </div>
          <div className="px-8">
            <StatCell label="Open Scrims" value={openScrimCount} accent />
          </div>
          <div className="pl-8">
            <StatCell label="Tournaments" value={tournamentCount} accent />
          </div>
        </div>

        <HudDivider />

        {/* ── MODULE NAVIGATION ───────────────────────────────────── */}
        <div className="py-5">
          <SectionLabel>Modules</SectionLabel>
          <div className="mt-3 flex flex-col gap-px">
            <NavRow
              href="/teams"
              code="01"
              title="Teams &amp; Roster"
              desc="สร้างทีม จัดการ Roster คัดลอก Invite Code"
              accentClass="text-cyan-400"
              hoverBorderClass="hover:border-cyan-500/40"
            />
            <NavRow
              href="/scrims"
              code="02"
              title="Scrim Finder"
              desc="ลงประกาศหาคู่ซ้อม เลือก Map Pool เช็กเวลาซ้ำซ้อน"
              accentClass="text-violet-400"
              hoverBorderClass="hover:border-violet-500/40"
            />
            <NavRow
              href="/tournaments"
              code="03"
              title="Bracket Manager"
              desc="Single Elimination · บันทึกผลสกอร์ · ดันผู้ชนะอัตโนมัติ"
              accentClass="text-amber-400"
              hoverBorderClass="hover:border-amber-500/40"
            />
          </div>
        </div>

        {/* ── PERSONAL FEED (authed only) ─────────────────────────── */}
        {currentUser && (
          <>
            <HudDivider />
            <div className="py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* MY TEAMS */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>
                    My Teams ({currentUser.memberships.length})
                  </SectionLabel>
                  <Link
                    href="/teams"
                    className="font-mono text-[10px] text-cyan-400 hover:text-cyan-300 uppercase tracking-widest transition-colors"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    + Create / Join
                  </Link>
                </div>

                {currentUser.memberships.length === 0 ? (
                  <EmptyState message="คุณยังไม่ได้สังกัดทีมใด" />
                ) : (
                  <ul className="flex flex-col gap-px">
                    {currentUser.memberships.map((m) => (
                      <li key={m.id}>
                        <Link
                          href={`/teams/${m.team.id}`}
                          className="group flex items-center justify-between border border-zinc-800/60 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 px-4 py-2.5 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="font-mono text-xs font-bold text-cyan-400 shrink-0"
                              style={{ fontFamily: "var(--font-geist-mono)" }}
                            >
                              [{m.team.tag}]
                            </span>
                            <span className="text-sm font-medium text-zinc-200 group-hover:text-white truncate transition-colors">
                              {m.team.name}
                            </span>
                          </div>
                          <RoleBadge role={m.role} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* CONFIRMED SCRIMS */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>
                    Confirmed Scrims ({myConfirmedScrims.length})
                  </SectionLabel>
                  <Link
                    href="/scrims"
                    className="font-mono text-[10px] text-violet-400 hover:text-violet-300 uppercase tracking-widest transition-colors"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    View Schedule →
                  </Link>
                </div>

                {myConfirmedScrims.length === 0 ? (
                  <EmptyState message="ยังไม่มีนัดซ้อมที่ยืนยัน" />
                ) : (
                  <ul className="flex flex-col gap-px">
                    {myConfirmedScrims.map((scrim) => (
                      <li
                        key={scrim.id}
                        className="border border-zinc-800/60 bg-zinc-900/50 px-4 py-2.5 flex items-center justify-between"
                      >
                        <span
                          className="font-mono text-xs font-semibold text-zinc-200"
                          style={{ fontFamily: "var(--font-geist-mono)" }}
                        >
                          [{scrim.hostTeam.tag}]{" "}
                          <span className="text-zinc-500">vs</span> [
                          {scrim.guestTeam?.tag ?? "TBD"}]
                        </span>
                        <span
                          className="font-mono text-[10px] text-zinc-500 tabular-nums shrink-0 ml-3"
                          style={{ fontFamily: "var(--font-geist-mono)" }}
                        >
                          {formatDateTime(scrim.startTime)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── FOOTER ──────────────────────────────────────────────── */}
        <HudDivider />
        <div className="py-4 flex items-center justify-between">
          <span
            className="font-mono text-[10px] text-zinc-600 tracking-widest uppercase"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Scrim &amp; Bracket Manager
          </span>
          <span
            className="font-mono text-[10px] text-zinc-700"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </main>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function NavRow({
  href,
  code,
  title,
  desc,
  accentClass,
  hoverBorderClass,
}: {
  href: string;
  code: string;
  title: string;
  desc: string;
  accentClass: string;
  hoverBorderClass: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-5 border border-zinc-800/60 ${hoverBorderClass} bg-zinc-900/30 hover:bg-zinc-900 px-5 py-4 transition-colors`}
    >
      {/* Module index */}
      <span
        className={`font-mono text-xs font-bold ${accentClass} w-5 shrink-0 tabular-nums`}
        style={{ fontFamily: "var(--font-geist-mono)" }}
        aria-hidden="true"
      >
        {code}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">
            <span dangerouslySetInnerHTML={{ __html: title }} />
          </h2>
          <span
            className={`font-mono text-xs ${accentClass} opacity-0 group-hover:opacity-100 transition-opacity`}
            aria-hidden="true"
          >
            →
          </span>
        </div>
        <p className="text-xs text-zinc-500 mt-0.5 truncate">{desc}</p>
      </div>
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border border-dashed border-zinc-800 px-4 py-5 text-center">
      <span className="text-xs text-zinc-600">{message}</span>
    </div>
  );
}
