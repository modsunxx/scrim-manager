import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getNextVetoTurn, type VetoStepEntry } from "@/lib/veto";
import { MatchScoreForm } from "@/app/tournaments/tournament-client";
import { LiveSync } from "@/components/live-sync";
import { LobbyInfoBox, MapVetoBoard } from "./match-client";

export default async function MatchRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [currentUser, match] = await Promise.all([
    getCurrentUser(),
    prisma.match.findUnique({
      where: { id },
      include: {
        tournament: true,
        teamA: {
          include: {
            members: {
              include: { user: { select: { id: true, gamerTag: true } } },
            },
          },
        },
        teamB: {
          include: {
            members: {
              include: { user: { select: { id: true, gamerTag: true } } },
            },
          },
        },
      },
    }),
  ]);

  if (!match || !match.teamA || !match.teamB) {
    notFound();
  }

  const isOrganizer = currentUser?.role === "ORGANIZER";
  const isCaptainA = match.teamA.members.some(
    (m) => m.userId === currentUser?.id && m.role === "CAPTAIN",
  );
  const isCaptainB = match.teamB.members.some(
    (m) => m.userId === currentUser?.id && m.role === "CAPTAIN",
  );
  const isParticipant =
    isOrganizer ||
    match.teamA.members.some((m) => m.userId === currentUser?.id) ||
    match.teamB.members.some((m) => m.userId === currentUser?.id);

  const vetoLog = (
    Array.isArray(match.vetoLog) ? match.vetoLog : []
  ) as VetoStepEntry[];
  const nextTurn = getNextVetoTurn(
    match.bestOf,
    match.tournament.game,
    vetoLog,
  );

  const canActNow =
    !match.winnerId &&
    nextTurn.kind !== "DONE" &&
    (isOrganizer || (nextTurn.team === "A" ? isCaptainA : isCaptainB));

  const isLive = !match.winnerId;
  const winnerIsA = match.winnerId === match.teamA.id;
  const winnerIsB = match.winnerId === match.teamB.id;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ── TOP NAV BAR ─────────────────────────────────────────── */}
      <div className="border-b border-zinc-800 px-6 py-2 flex items-center justify-between">
        <Link
          href="/tournaments"
          className="font-mono text-xs text-zinc-500 hover:text-zinc-300 tracking-widest uppercase transition-colors"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          ← Bracket
        </Link>

        <div className="flex items-center gap-4">
          {/* Tournament + round meta */}
          <span
            className="font-mono text-[10px] text-zinc-600 tracking-widest uppercase"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {match.tournament.name} · R{match.round} · BO{match.bestOf}
          </span>

          <LiveSync
            active={isLive}
            intervalMs={2000}
            label="Live"
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        {/* ── BROADCAST SCOREBOARD ────────────────────────────────── */}
        <div className="py-8">
          <BroadcastScoreboard
            teamA={match.teamA}
            teamB={match.teamB}
            scoreA={match.scoreA}
            scoreB={match.scoreB}
            winnerId={match.winnerId}
            winnerIsA={winnerIsA}
            winnerIsB={winnerIsB}
            isLive={isLive}
          />
        </div>

        <div className="h-px bg-zinc-800" />

        {/* ── ROSTER PANELS ───────────────────────────────────────── */}
        <div className="py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <RosterPanel
            team={match.teamA}
            side="A"
            isWinner={winnerIsA}
          />
          <RosterPanel
            team={match.teamB}
            side="B"
            isWinner={winnerIsB}
          />
        </div>

        <div className="h-px bg-zinc-800" />

        {/* ── MAP VETO BOARD ──────────────────────────────────────── */}
        <div className="py-5">
          <MapVetoBoard
            matchId={match.id}
            bestOf={match.bestOf}
            mapPool={match.mapPool}
            bannedMaps={match.bannedMaps}
            pickedMaps={match.pickedMaps}
            vetoLog={vetoLog}
            nextTurn={nextTurn}
            teamATag={match.teamA.tag}
            teamBTag={match.teamB.tag}
            canActNow={canActNow}
            isFinished={Boolean(match.winnerId)}
          />
        </div>

        <div className="h-px bg-zinc-800" />

        {/* ── LOBBY INFO ──────────────────────────────────────────── */}
        <div className="py-5">
          {isParticipant ? (
            <LobbyInfoBox
              matchId={match.id}
              lobbyInfo={match.lobbyInfo}
              canEdit={isOrganizer || isCaptainA || isCaptainB}
            />
          ) : (
            <div className="border border-dashed border-zinc-800 px-4 py-4 text-center">
              <span className="text-xs text-zinc-600">
                ข้อมูล Server IP และรหัสห้องจะแสดงเฉพาะสมาชิกของทั้ง 2 ทีม
              </span>
            </div>
          )}
        </div>

        {/* ── ORGANIZER SCORE ENTRY ───────────────────────────────── */}
        {isOrganizer && !match.winnerId && (
          <>
            <div className="h-px bg-zinc-800" />
            <div className="py-5 max-w-sm">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="font-mono text-[10px] font-semibold tracking-[0.18em] uppercase text-zinc-500"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  Record Score · Organizer
                </span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>
              <MatchScoreForm matchId={match.id} />
            </div>
          </>
        )}

        {/* ── FOOTER ──────────────────────────────────────────────── */}
        <div className="h-px bg-zinc-800" />
        <div className="py-4 flex items-center justify-between">
          <span
            className="font-mono text-[10px] text-zinc-700 tracking-widest uppercase"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Match · {match.id.slice(0, 8)}
          </span>
          <span
            className="font-mono text-[10px] text-zinc-700"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {match.tournament.game}
          </span>
        </div>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   BroadcastScoreboard — the visual centrepiece of the match room
───────────────────────────────────────────────────────────────────────── */

type TeamWithMembers = {
  id: string;
  tag: string;
  name: string;
  members: { id: string; role: string; userId: string; user: { id: string; gamerTag: string } }[];
};

function BroadcastScoreboard({
  teamA,
  teamB,
  scoreA,
  scoreB,
  winnerId,
  winnerIsA,
  winnerIsB,
  isLive,
}: {
  teamA: TeamWithMembers;
  teamB: TeamWithMembers;
  scoreA: number;
  scoreB: number;
  winnerId: string | null;
  winnerIsA: boolean;
  winnerIsB: boolean;
  isLive: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-0">
      {/* Team A */}
      <div
        className={`flex flex-col border-t-2 pt-4 ${
          winnerIsA
            ? "border-cyan-400"
            : winnerId
              ? "border-zinc-800"
              : "border-zinc-700"
        }`}
      >
        <span
          className="font-mono text-xs font-bold text-cyan-400 tracking-widest"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          [{teamA.tag}]
        </span>
        <h1 className="text-2xl font-bold text-white mt-0.5 leading-tight">
          {teamA.name}
        </h1>
        {winnerIsA && (
          <span
            className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-cyan-400 mt-1"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Winner ✓
          </span>
        )}
      </div>

      {/* Score center */}
      <div className="flex flex-col items-center px-8">
        {/* Score */}
        <div className="flex items-baseline gap-3">
          <span
            className={`font-mono text-5xl font-bold tabular-nums leading-none ${
              winnerIsA ? "text-white" : winnerId ? "text-zinc-600" : "text-white"
            }`}
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {winnerId ? scoreA : "—"}
          </span>
          <span
            className="font-mono text-2xl font-bold text-zinc-700"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            :
          </span>
          <span
            className={`font-mono text-5xl font-bold tabular-nums leading-none ${
              winnerIsB ? "text-white" : winnerId ? "text-zinc-600" : "text-white"
            }`}
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {winnerId ? scoreB : "—"}
          </span>
        </div>

        {/* Status pill */}
        <div className="mt-2">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-70" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-400" />
              </span>
              <span
                className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-rose-400"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                Live
              </span>
            </span>
          ) : (
            <span
              className="font-mono text-[10px] text-zinc-600 tracking-widest uppercase"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Final
            </span>
          )}
        </div>
      </div>

      {/* Team B */}
      <div
        className={`flex flex-col items-end border-t-2 pt-4 ${
          winnerIsB
            ? "border-cyan-400"
            : winnerId
              ? "border-zinc-800"
              : "border-zinc-700"
        }`}
      >
        <span
          className="font-mono text-xs font-bold text-cyan-400 tracking-widest"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          [{teamB.tag}]
        </span>
        <h2 className="text-2xl font-bold text-white mt-0.5 leading-tight text-right">
          {teamB.name}
        </h2>
        {winnerIsB && (
          <span
            className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-cyan-400 mt-1"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Winner ✓
          </span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   RosterPanel
───────────────────────────────────────────────────────────────────────── */

function RosterPanel({
  team,
  side,
  isWinner,
}: {
  team: TeamWithMembers;
  side: "A" | "B";
  isWinner: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="font-mono text-[10px] font-semibold tracking-[0.18em] uppercase text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          Roster · {side === "A" ? "Team A" : "Team B"}
        </span>
        {isWinner && (
          <span
            className="font-mono text-[9px] font-bold tracking-[0.15em] uppercase text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Winner
          </span>
        )}
      </div>
      <ul className="flex flex-col gap-px">
        {team.members.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between border border-zinc-800/60 bg-zinc-900/40 px-3.5 py-2"
          >
            <span className="text-sm text-zinc-200 font-medium">
              {m.user.gamerTag}
            </span>
            <span
              className="font-mono text-[10px] text-zinc-600 tracking-widest uppercase"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {m.role}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
