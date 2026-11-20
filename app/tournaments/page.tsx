import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { LiveSync } from "@/components/live-sync";
import {
  CreateTournamentForm,
  DeleteTournamentButton,
  MatchScoreForm,
  TournamentRegistrationBox,
} from "./tournament-client";

function getRoundLabel(round: number, totalRounds: number) {
  if (round === totalRounds) return "Grand Final";
  if (round === totalRounds - 1) return "Semi-Finals";
  return `Round ${round}`;
}

function getFormatLabel(matchFormat: string) {
  if (matchFormat === "ALL_BO3") return "All BO3";
  if (matchFormat === "FINAL_BO3") return "Final BO3";
  return "All BO1";
}

export default async function TournamentsPage() {
  const [currentUser, allTeams, tournaments] = await Promise.all([
    getCurrentUser(),
    prisma.team.findMany({
      include: { _count: { select: { members: true } } },
    }),
    prisma.tournament.findMany({
      include: {
        organizer: { select: { gamerTag: true } },
        registrations: {
          include: {
            team: {
              include: { _count: { select: { members: true } } },
            },
          },
          orderBy: { registeredAt: "asc" },
        },
        matches: {
          include: {
            teamA: true,
            teamB: true,
          },
          orderBy: [{ round: "asc" }, { position: "asc" }],
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const isOrganizer = currentUser?.role === "ORGANIZER";
  const hasActiveTournament = tournaments.some((t) => t.status !== "FINISHED");

  const captainTeamIds = new Set(
    currentUser?.memberships
      .filter((m) => m.role === "CAPTAIN")
      .map((m) => m.teamId) ?? [],
  );

  const captainTeams = allTeams
    .filter((t) => captainTeamIds.has(t.id))
    .map((t) => ({
      id: t.id,
      name: t.name,
      tag: t.tag,
      memberCount: t._count.members,
    }));

  const activeTournamentsCount = tournaments.filter(
    (t) => t.status !== "FINISHED",
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
            MODULE // 03 · TOURNAMENTS &amp; BRACKETS
          </span>
          <LiveSync
            active={hasActiveTournament}
            intervalMs={3500}
            label="Live Updates"
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* ── HEADER & TELEMETRY ──────────────────────────────────── */}
        <div className="pt-8 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">
            Tournaments &amp; <span className="text-amber-400">Brackets</span>
          </h1>
          <p className="mt-2 text-xs text-zinc-500 max-w-lg leading-relaxed">
            สมัครเข้าแข่งขัน ตรวจสอบสายแข่ง Bracket และเข้าห้อง Live Map Veto
          </p>
        </div>

        {/* Telemetry Row */}
        <div className="py-4 border-y border-zinc-800 grid grid-cols-3 gap-0 divide-x divide-zinc-800 mb-8">
          <div className="pr-6">
            <span
              className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 block mb-0.5"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Tournaments
            </span>
            <span
              className="font-mono text-xl font-bold text-white tabular-nums"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {tournaments.length}
            </span>
          </div>
          <div className="px-6">
            <span
              className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 block mb-0.5"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Active Events
            </span>
            <span
              className="font-mono text-xl font-bold text-amber-400 tabular-nums"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {activeTournamentsCount}
            </span>
          </div>
          <div className="pl-6">
            <span
              className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 block mb-0.5"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              My Eligible Teams
            </span>
            <span
              className="font-mono text-xl font-bold text-cyan-400 tabular-nums"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {currentUser ? captainTeams.length : "—"}
            </span>
          </div>
        </div>

        {/* ── ORGANIZER FORM ──────────────────────────────────────── */}
        <CreateTournamentForm isOrganizer={isOrganizer} />

        {/* ── TOURNAMENT DIRECTORY ─────────────────────────────────── */}
        <div className="pb-12 space-y-8">
          <div className="flex items-center gap-3">
            <span
              className="font-mono text-[10px] font-semibold tracking-[0.18em] uppercase text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Official Tournament Circuit
            </span>
            <div className="flex-1 h-px bg-zinc-800" />
            <span
              className="font-mono text-[10px] text-zinc-600 tracking-widest"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              EVENTS: {tournaments.length}
            </span>
          </div>

          {tournaments.length === 0 ? (
            <div className="border border-dashed border-zinc-800 p-8 text-center">
              <span
                className="font-mono text-xs text-zinc-600 uppercase tracking-widest block"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                No active tournaments
              </span>
              <p className="text-xs text-zinc-600 mt-1">
                {isOrganizer
                  ? "เปิดรับสมัครทัวร์นาเมนต์แรกได้จากฟอร์ม Organizer ด้านบน"
                  : "รอผู้จัดเปิดรับสมัครรายการใหม่"}
              </p>
            </div>
          ) : (
            tournaments.map((tournament) => {
              const totalRounds = Math.log2(tournament.maxTeams);
              const rounds = Array.from(
                { length: totalRounds },
                (_, i) => i + 1,
              );

              const finalMatch = tournament.matches.find(
                (m) => m.round === totalRounds,
              );
              const championTeam =
                finalMatch?.winnerId === finalMatch?.teamAId
                  ? finalMatch?.teamA
                  : finalMatch?.winnerId === finalMatch?.teamBId
                    ? finalMatch?.teamB
                    : null;

              return (
                <section
                  key={tournament.id}
                  className="border border-zinc-800 bg-zinc-900/30 p-6 space-y-6"
                >
                  {/* Tournament Meta Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-zinc-800/80">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span
                          className="font-mono text-[9px] font-bold text-amber-400 border border-amber-500/30 bg-amber-950/20 px-1.5 py-0.5 uppercase tracking-wider"
                          style={{ fontFamily: "var(--font-geist-mono)" }}
                        >
                          {tournament.game}
                        </span>
                        <span
                          className="font-mono text-[9px] text-zinc-400 border border-zinc-800 px-1.5 py-0.5 uppercase tracking-wider"
                          style={{ fontFamily: "var(--font-geist-mono)" }}
                        >
                          {getFormatLabel(tournament.matchFormat)}
                        </span>
                        <span
                          className={`font-mono text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border ${
                            tournament.status === "REGISTRATION"
                              ? "border-amber-500/40 bg-amber-950/20 text-amber-300"
                              : tournament.status === "FINISHED"
                                ? "border-zinc-800 bg-zinc-900 text-zinc-500"
                                : "border-cyan-500/40 bg-cyan-950/20 text-cyan-300"
                          }`}
                          style={{ fontFamily: "var(--font-geist-mono)" }}
                        >
                          {tournament.status}
                        </span>
                        {tournament.organizer && (
                          <span
                            className="font-mono text-[10px] text-zinc-600"
                            style={{ fontFamily: "var(--font-geist-mono)" }}
                          >
                            ORG // {tournament.organizer.gamerTag}
                          </span>
                        )}
                      </div>

                      <h2 className="text-xl font-bold text-white">
                        {tournament.name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-3">
                      {championTeam && (
                        <div className="border border-amber-500/40 bg-amber-950/20 px-3.5 py-1.5 text-right">
                          <span
                            className="font-mono text-[9px] uppercase tracking-widest text-amber-400 block"
                            style={{ fontFamily: "var(--font-geist-mono)" }}
                          >
                            🏆 CHAMPION
                          </span>
                          <span className="text-sm font-bold text-white">
                            [{championTeam.tag}] {championTeam.name}
                          </span>
                        </div>
                      )}

                      {isOrganizer && (
                        <DeleteTournamentButton tournamentId={tournament.id} />
                      )}
                    </div>
                  </div>

                  {/* Body: Registration or Bracket */}
                  {tournament.status === "REGISTRATION" ? (
                    <TournamentRegistrationBox
                      tournamentId={tournament.id}
                      maxTeams={tournament.maxTeams}
                      minPlayers={tournament.minPlayers}
                      registeredTeams={tournament.registrations.map((r) => ({
                        id: r.team.id,
                        name: r.team.name,
                        tag: r.team.tag,
                        memberCount: r.team._count.members,
                      }))}
                      captainTeams={captainTeams}
                      isOrganizer={isOrganizer}
                    />
                  ) : (
                    <div
                      className={`grid grid-cols-1 ${
                        totalRounds === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
                      } gap-4 overflow-x-auto`}
                    >
                      {rounds.map((round) => {
                        const roundMatches = tournament.matches.filter(
                          (m) => m.round === round,
                        );

                        return (
                          <div key={round} className="space-y-3">
                            <span
                              className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 block"
                              style={{ fontFamily: "var(--font-geist-mono)" }}
                            >
                              {getRoundLabel(round, totalRounds)}
                            </span>

                            <div className="flex flex-col gap-3">
                              {roundMatches.map((match) => {
                                const isReady = Boolean(
                                  match.teamAId && match.teamBId,
                                );
                                const canSubmit =
                                  isOrganizer && isReady && !match.winnerId;

                                return (
                                  <div
                                    key={match.id}
                                    className="border border-zinc-800 bg-zinc-950 p-3 space-y-2"
                                  >
                                    {/* Team A */}
                                    <div
                                      className={`flex items-center justify-between px-2 py-1 text-xs border ${
                                        match.winnerId &&
                                        match.winnerId === match.teamAId
                                          ? "border-cyan-500/40 bg-cyan-950/20 text-white font-bold"
                                          : "border-transparent text-zinc-300"
                                      }`}
                                    >
                                      <span className="truncate">
                                        {match.teamA ? (
                                          <>
                                            <span
                                              className="font-mono text-cyan-400 mr-1.5"
                                              style={{
                                                fontFamily:
                                                  "var(--font-geist-mono)",
                                              }}
                                            >
                                              [{match.teamA.tag}]
                                            </span>
                                            {match.teamA.name}
                                          </>
                                        ) : (
                                          <span className="font-mono text-zinc-600 italic">
                                            TBD
                                          </span>
                                        )}
                                      </span>
                                      <span
                                        className="font-mono font-bold ml-2 tabular-nums"
                                        style={{
                                          fontFamily:
                                            "var(--font-geist-mono)",
                                        }}
                                      >
                                        {match.winnerId ? match.scoreA : "—"}
                                      </span>
                                    </div>

                                    {/* Team B */}
                                    <div
                                      className={`flex items-center justify-between px-2 py-1 text-xs border ${
                                        match.winnerId &&
                                        match.winnerId === match.teamBId
                                          ? "border-cyan-500/40 bg-cyan-950/20 text-white font-bold"
                                          : "border-transparent text-zinc-300"
                                      }`}
                                    >
                                      <span className="truncate">
                                        {match.teamB ? (
                                          <>
                                            <span
                                              className="font-mono text-cyan-400 mr-1.5"
                                              style={{
                                                fontFamily:
                                                  "var(--font-geist-mono)",
                                              }}
                                            >
                                              [{match.teamB.tag}]
                                            </span>
                                            {match.teamB.name}
                                          </>
                                        ) : (
                                          <span className="font-mono text-zinc-600 italic">
                                            TBD
                                          </span>
                                        )}
                                      </span>
                                      <span
                                        className="font-mono font-bold ml-2 tabular-nums"
                                        style={{
                                          fontFamily:
                                            "var(--font-geist-mono)",
                                        }}
                                      >
                                        {match.winnerId ? match.scoreB : "—"}
                                      </span>
                                    </div>

                                    {/* Match room link & format */}
                                    {isReady && (
                                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] gap-2">
                                        <span
                                          className="font-mono text-[10px] text-zinc-500 truncate"
                                          style={{
                                            fontFamily:
                                              "var(--font-geist-mono)",
                                          }}
                                        >
                                          BO{match.bestOf}
                                          {match.pickedMaps.length > 0
                                            ? ` · ${match.pickedMaps.join(", ")}`
                                            : ` · Veto (${match.bannedMaps.length} banned)`}
                                        </span>
                                        <Link
                                          href={`/matches/${match.id}`}
                                          className="font-mono text-[10px] text-cyan-400 hover:text-cyan-300 uppercase tracking-wider font-semibold transition-colors shrink-0"
                                          style={{
                                            fontFamily:
                                              "var(--font-geist-mono)",
                                          }}
                                        >
                                          [ VETO ROOM → ]
                                        </Link>
                                      </div>
                                    )}

                                    {/* Organizer quick score */}
                                    {canSubmit && (
                                      <MatchScoreForm matchId={match.id} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })
          )}
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────── */}
        <div className="border-t border-zinc-800 py-4 flex items-center justify-between">
          <span
            className="font-mono text-[10px] text-zinc-700 tracking-widest uppercase"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Scrim &amp; Bracket Manager · Tournaments
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
