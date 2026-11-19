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

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/tournaments"
              className="text-xs text-zinc-400 hover:text-white transition"
            >
              ← กลับหน้าสายการแข่งขัน
            </Link>

            <LiveSync
              active={!match.winnerId}
              intervalMs={2000}
              label="Live Match Room"
            />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
              {match.tournament.name}
            </span>
            <span className="text-xs text-zinc-400">
              Round {match.round} • BO{match.bestOf}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mt-1">
            [{match.teamA.tag}] {match.teamA.name}{" "}
            <span className="text-zinc-500 text-xl mx-2">VS</span>[
            {match.teamB.tag}] {match.teamB.name}
          </h1>
        </div>

        {/* Scoreboard & Roster 2 ฝั่ง */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[match.teamA, match.teamB].map((team, index) => {
            const score = index === 0 ? match.scoreA : match.scoreB;
            const isWinner = match.winnerId === team.id;

            return (
              <div
                key={team.id}
                className={`bg-zinc-900 border rounded-xl p-5 space-y-3 ${
                  isWinner ? "border-emerald-500/50" : "border-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-400 mr-1.5">
                      [{team.tag}]
                    </span>
                    <span className="text-lg font-bold text-white">
                      {team.name}
                    </span>
                  </div>
                  <span className="text-2xl font-mono font-bold text-white">
                    {match.winnerId ? score : "-"}
                  </span>
                </div>

                <ul className="space-y-1 text-xs text-zinc-400 border-t border-zinc-800 pt-3">
                  {team.members.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between"
                    >
                      <span>{m.user.gamerTag}</span>
                      <span className="text-[10px] text-zinc-500">
                        {m.role}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* ระบบ Map Veto & Side Selection */}
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

        {/* ข้อมูลห้องแข่งขัน */}
        {isParticipant ? (
          <LobbyInfoBox
            matchId={match.id}
            lobbyInfo={match.lobbyInfo}
            canEdit={isOrganizer || isCaptainA || isCaptainB}
          />
        ) : (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-500">
            * ข้อมูล Server IP และรหัสเข้าห้องเกมจะแสดงเฉพาะสมาชิกของทั้ง 2
            ทีมที่แข่งขันเท่านั้น
          </div>
        )}

        {/* ช่องกรอกผลสกอร์สำหรับ Organizer */}
        {isOrganizer && !match.winnerId && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 max-w-sm">
            <h3 className="text-sm font-semibold text-white">
              บันทึกผลการแข่งขัน (Organizer)
            </h3>
            <MatchScoreForm matchId={match.id} />
          </div>
        )}
      </div>
    </main>
  );
}
