import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  DeleteTeamButton,
  InviteCodeBox,
  MemberControls,
  TeamForms,
} from "./team-client";

export default async function TeamsPage() {
  const [currentUser, teams] = await Promise.all([
    getCurrentUser(),
    prisma.team.findMany({
      include: {
        members: {
          include: {
            user: {
              select: { id: true, gamerTag: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const myTeamCount = teams.filter((t) =>
    t.members.some((m) => m.userId === currentUser?.id),
  ).length;

  const captainTeamCount = teams.filter((t) =>
    t.members.some((m) => m.userId === currentUser?.id && m.role === "CAPTAIN"),
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
            MODULE // 01 · TEAMS &amp; ROSTER
          </span>
          {currentUser && (
            <span
              className="font-mono text-xs text-zinc-400"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              <span className="text-cyan-400">{"//"}</span> {currentUser.gamerTag}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        {/* ── HEADER & TELEMETRY ──────────────────────────────────── */}
        <div className="pt-8 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">
            Teams &amp; <span className="text-cyan-400">Rosters</span>
          </h1>
          <p className="mt-2 text-xs text-zinc-500 max-w-lg leading-relaxed">
            จัดการสมาชิกในสังกัด แต่งตั้งกัปตัน และแชร์ Invite Code เข้าร่วมทีม
          </p>
        </div>

        {/* Telemetry Row */}
        <div className="py-4 border-y border-zinc-800 grid grid-cols-3 gap-0 divide-x divide-zinc-800 mb-8">
          <div className="pr-6">
            <span
              className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 block mb-0.5"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Total Teams
            </span>
            <span
              className="font-mono text-xl font-bold text-white tabular-nums"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {teams.length}
            </span>
          </div>
          <div className="px-6">
            <span
              className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 block mb-0.5"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              My Teams
            </span>
            <span
              className="font-mono text-xl font-bold text-cyan-400 tabular-nums"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {currentUser ? myTeamCount : "—"}
            </span>
          </div>
          <div className="pl-6">
            <span
              className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 block mb-0.5"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Captain Role
            </span>
            <span
              className="font-mono text-xl font-bold text-amber-400 tabular-nums"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {currentUser ? captainTeamCount : "—"}
            </span>
          </div>
        </div>

        {/* ── FORMS (CREATE / JOIN) ───────────────────────────────── */}
        <TeamForms isLoggedIn={Boolean(currentUser)} />

        {/* ── TEAMS DIRECTORY ─────────────────────────────────────── */}
        <div className="pb-12 space-y-4">
          <div className="flex items-center gap-3">
            <span
              className="font-mono text-[10px] font-semibold tracking-[0.18em] uppercase text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Registered Teams Directory
            </span>
            <div className="flex-1 h-px bg-zinc-800" />
            <span
              className="font-mono text-[10px] text-zinc-600 tracking-widest"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              COUNT: {teams.length}
            </span>
          </div>

          {teams.length === 0 ? (
            <div className="border border-dashed border-zinc-800 p-8 text-center">
              <span
                className="font-mono text-xs text-zinc-600 uppercase tracking-widest block"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                No teams registered in the system
              </span>
              <p className="text-xs text-zinc-600 mt-1">
                สร้างทีมแรกโดยใช้ฟอร์มด้านบน
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team) => {
                const isCaptain = team.members.some(
                  (m) => m.userId === currentUser?.id && m.role === "CAPTAIN",
                );
                const isMember = team.members.some(
                  (m) => m.userId === currentUser?.id,
                );

                return (
                  <div
                    key={team.id}
                    className={`border transition-colors ${
                      isMember
                        ? "border-cyan-500/40 bg-zinc-900/40"
                        : "border-zinc-800/80 bg-zinc-900/20 hover:border-zinc-700"
                    } p-4 flex flex-col justify-between gap-4`}
                  >
                    <div>
                      {/* Team Header */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-800/60">
                        <Link
                          href={`/teams/${team.id}`}
                          className="group flex items-baseline gap-2 min-w-0"
                        >
                          <span
                            className="font-mono text-xs font-bold text-cyan-400 shrink-0"
                            style={{ fontFamily: "var(--font-geist-mono)" }}
                          >
                            [{team.tag}]
                          </span>
                          <h2 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                            {team.name}
                          </h2>
                        </Link>

                        <div className="flex items-center gap-2 shrink-0">
                          {isMember && (
                            <span
                              className="font-mono text-[9px] font-semibold text-cyan-400 border border-cyan-500/30 bg-cyan-950/20 px-1.5 py-0.5 uppercase tracking-wider"
                              style={{ fontFamily: "var(--font-geist-mono)" }}
                            >
                              MEMBER
                            </span>
                          )}
                          <span
                            className="font-mono text-[10px] text-zinc-500 tabular-nums"
                            style={{ fontFamily: "var(--font-geist-mono)" }}
                          >
                            {team.members.length} ROSTER
                          </span>
                        </div>
                      </div>

                      {/* Invite Code (Captain Only) */}
                      {isCaptain && (
                        <div className="mt-3">
                          <InviteCodeBox
                            teamId={team.id}
                            inviteCode={team.inviteCode}
                          />
                        </div>
                      )}

                      {/* Active Roster */}
                      <div className="mt-3">
                        <span
                          className="font-mono text-[9px] font-semibold tracking-[0.15em] uppercase text-zinc-600 block mb-1.5"
                          style={{ fontFamily: "var(--font-geist-mono)" }}
                        >
                          Active Roster ({team.members.length})
                        </span>
                        <ul className="flex flex-col gap-px">
                          {team.members.map((member) => (
                            <li
                              key={member.id}
                              className="flex items-center justify-between border border-zinc-800/40 bg-zinc-950/40 px-3 py-1.5"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-medium text-zinc-200 truncate">
                                  {member.user.gamerTag}
                                </span>
                                {member.role === "CAPTAIN" && (
                                  <span
                                    className="font-mono text-[9px] font-bold text-amber-400 border border-amber-500/30 px-1 py-0.2 uppercase"
                                    style={{
                                      fontFamily: "var(--font-geist-mono)",
                                    }}
                                  >
                                    CPT
                                  </span>
                                )}
                              </div>

                              {isCaptain ? (
                                <MemberControls
                                  memberId={member.id}
                                  currentRole={member.role}
                                  isSelf={member.userId === currentUser?.id}
                                />
                              ) : (
                                member.role !== "CAPTAIN" && (
                                  <span
                                    className="font-mono text-[10px] text-zinc-600 uppercase"
                                    style={{
                                      fontFamily: "var(--font-geist-mono)",
                                    }}
                                  >
                                    {member.role}
                                  </span>
                                )
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    {isCaptain && (
                      <div className="pt-2 border-t border-zinc-800/60 flex justify-end">
                        <DeleteTeamButton teamId={team.id} />
                      </div>
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
            Scrim &amp; Bracket Manager · Teams
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
