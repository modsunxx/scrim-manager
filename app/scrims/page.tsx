import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  AcceptScrimForm,
  CancelScrimButton,
  CreateScrimForm,
} from "./scrim-client";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function ScrimsPage() {
  const [currentUser, scrims] = await Promise.all([
    getCurrentUser(),
    prisma.scrim.findMany({
      where: { status: { not: "CANCELLED" } },
      include: {
        hostTeam: { select: { id: true, name: true, tag: true } },
        guestTeam: { select: { id: true, name: true, tag: true } },
      },
      orderBy: { startTime: "asc" },
    }),
  ]);

  const captainTeams =
    currentUser?.memberships
      .filter((m) => m.role === "CAPTAIN")
      .map((m) => ({
        id: m.team.id,
        name: m.team.name,
        tag: m.team.tag,
      })) ?? [];

  const captainTeamIds = new Set(captainTeams.map((t) => t.id));

  const openScrimsCount = scrims.filter((s) => s.status === "OPEN").length;
  const confirmedScrimsCount = scrims.filter(
    (s) => s.status === "CONFIRMED",
  ).length;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ── TOP NAV BAR ─────────────────────────────────────────── */}
      <div className="border-b border-zinc-800 px-6 py-2 flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-xs text-zinc-500 hover:text-zinc-300 tracking-widest uppercase transition-colors"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          ← SBM·HOME
        </Link>
        <div className="flex items-center gap-4">
          <span
            className="font-mono text-[10px] text-zinc-600 tracking-widest uppercase"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            MODULE // 02 · SCRIM FINDER
          </span>
          {currentUser && (
            <span
              className="font-mono text-xs text-zinc-400"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              <span className="text-violet-400">//</span> {currentUser.gamerTag}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        {/* ── HEADER & TELEMETRY ──────────────────────────────────── */}
        <div className="pt-8 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">
            Scrim Finder &amp; <span className="text-violet-400">Lobbies</span>
          </h1>
          <p className="mt-2 text-xs text-zinc-500 max-w-lg leading-relaxed">
            ลงประกาศหาคู่ซ้อม เลือก Map Pool และตอบรับคำท้าพร้อมระบบเช็กเวลาซ้ำซ้อน
          </p>
        </div>

        {/* Telemetry Row */}
        <div className="py-4 border-y border-zinc-800 grid grid-cols-3 gap-0 divide-x divide-zinc-800 mb-8">
          <div className="pr-6">
            <span
              className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 block mb-0.5"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Open Lobbies
            </span>
            <span
              className="font-mono text-xl font-bold text-amber-400 tabular-nums"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {openScrimsCount}
            </span>
          </div>
          <div className="px-6">
            <span
              className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 block mb-0.5"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Confirmed
            </span>
            <span
              className="font-mono text-xl font-bold text-cyan-400 tabular-nums"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {confirmedScrimsCount}
            </span>
          </div>
          <div className="pl-6">
            <span
              className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 block mb-0.5"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Eligible Teams
            </span>
            <span
              className="font-mono text-xl font-bold text-white tabular-nums"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {currentUser ? captainTeams.length : "—"}
            </span>
          </div>
        </div>

        {/* ── FORM (POST SCRIM) ───────────────────────────────────── */}
        <CreateScrimForm
          captainTeams={captainTeams}
          isLoggedIn={Boolean(currentUser)}
        />

        {/* ── SCRIM SCHEDULE DIRECTORY ────────────────────────────── */}
        <div className="pb-12 space-y-4">
          <div className="flex items-center gap-3">
            <span
              className="font-mono text-[10px] font-semibold tracking-[0.18em] uppercase text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Active Scrim Schedule
            </span>
            <div className="flex-1 h-px bg-zinc-800" />
            <span
              className="font-mono text-[10px] text-zinc-600 tracking-widest"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              TOTAL: {scrims.length}
            </span>
          </div>

          {scrims.length === 0 ? (
            <div className="border border-dashed border-zinc-800 p-8 text-center">
              <span
                className="font-mono text-xs text-zinc-600 uppercase tracking-widest block"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                No active scrim lobbies
              </span>
              <p className="text-xs text-zinc-600 mt-1">
                เปิดห้องหาคู่ซ้อมเป็นทีมแรกด้วยฟอร์มด้านบน
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scrims.map((scrim) => {
                const isHostCaptain = captainTeamIds.has(scrim.hostTeamId);
                const isOpen = scrim.status === "OPEN";

                return (
                  <div
                    key={scrim.id}
                    className={`border transition-colors ${
                      isOpen
                        ? "border-amber-500/30 bg-zinc-900/30 hover:border-amber-500/50"
                        : "border-cyan-500/30 bg-zinc-900/40 hover:border-cyan-500/50"
                    } p-4 flex flex-col justify-between gap-4`}
                  >
                    <div className="space-y-3">
                      {/* Status header */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800/60">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-[9px] font-bold tracking-[0.15em] uppercase border px-2 py-0.5 ${
                              isOpen
                                ? "border-amber-500/40 bg-amber-950/20 text-amber-300"
                                : "border-cyan-500/40 bg-cyan-950/20 text-cyan-300"
                            }`}
                            style={{ fontFamily: "var(--font-geist-mono)" }}
                          >
                            {isOpen ? "OPEN LOBBY" : "CONFIRMED"}
                          </span>
                        </div>

                        {isHostCaptain && (
                          <CancelScrimButton scrimId={scrim.id} />
                        )}
                      </div>

                      {/* Team matchup */}
                      <div>
                        <div className="flex items-center gap-2 text-sm font-bold text-white flex-wrap">
                          <span
                            className="font-mono text-cyan-400"
                            style={{ fontFamily: "var(--font-geist-mono)" }}
                          >
                            [{scrim.hostTeam.tag}]
                          </span>
                          <span>{scrim.hostTeam.name}</span>

                          <span
                            className="font-mono text-[10px] text-zinc-600 px-1"
                            style={{ fontFamily: "var(--font-geist-mono)" }}
                          >
                            VS
                          </span>

                          {scrim.guestTeam ? (
                            <>
                              <span
                                className="font-mono text-amber-400"
                                style={{ fontFamily: "var(--font-geist-mono)" }}
                              >
                                [{scrim.guestTeam.tag}]
                              </span>
                              <span>{scrim.guestTeam.name}</span>
                            </>
                          ) : (
                            <span
                              className="font-mono text-xs text-zinc-600 tracking-wider"
                              style={{ fontFamily: "var(--font-geist-mono)" }}
                            >
                              [ WAITING CHALLENGER ]
                            </span>
                          )}
                        </div>

                        {/* Timing */}
                        <div
                          className="mt-2 font-mono text-[11px] text-zinc-400 tabular-nums flex items-center gap-2"
                          style={{ fontFamily: "var(--font-geist-mono)" }}
                        >
                          <span>{formatDateTime(scrim.startTime)}</span>
                          <span className="text-zinc-600">→</span>
                          <span>{formatDateTime(scrim.endTime)}</span>
                        </div>
                      </div>

                      {/* Map Pool */}
                      <div className="flex flex-wrap gap-1">
                        {scrim.mapPool.map((map) => (
                          <span
                            key={map}
                            className="font-mono text-[10px] border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-zinc-400"
                            style={{ fontFamily: "var(--font-geist-mono)" }}
                          >
                            {map}
                          </span>
                        ))}
                      </div>

                      {/* Notes */}
                      {scrim.notes && (
                        <p className="font-mono text-[11px] text-zinc-400 border border-zinc-800/60 bg-zinc-950/60 px-3 py-1.5">
                          // {scrim.notes}
                        </p>
                      )}
                    </div>

                    {/* Accept Challenge Form */}
                    {isOpen && (
                      <AcceptScrimForm
                        scrimId={scrim.id}
                        hostTeamId={scrim.hostTeamId}
                        captainTeams={captainTeams}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────── */}
        <div className="border-t border-zinc-800 py-4 flex items-center justify-between">
          <span
            className="font-mono text-[10px] text-zinc-700 tracking-widest uppercase"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Scrim &amp; Bracket Manager · Scrims
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
