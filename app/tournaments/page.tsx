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

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/"
              className="text-xs text-zinc-400 hover:text-white transition"
            >
              ← กลับหน้าหลัก
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
              Tournaments & Brackets
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              สมัครเข้าร่วมการแข่งขัน ตรวจสอบสายแข่ง และเข้าห้อง Map Veto
              ของแต่ละแมตช์
            </p>
          </div>

          <LiveSync
            active={hasActiveTournament}
            intervalMs={3500}
            label="Live Bracket Updates"
          />
        </div>

        <CreateTournamentForm isOrganizer={isOrganizer} />

        <div className="space-y-10">
          {tournaments.length === 0 ? (
            <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-sm">
              ยังไม่มีรายการแข่งขันในขณะนี้
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
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
                          {tournament.game}
                        </span>
                        <span className="text-xs font-medium bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                          {getFormatLabel(tournament.matchFormat)}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            tournament.status === "REGISTRATION"
                              ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                              : tournament.status === "FINISHED"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-indigo-500/10 text-indigo-400"
                          }`}
                        >
                          {tournament.status}
                        </span>
                        {tournament.organizer && (
                          <span className="text-xs text-zinc-500">
                            จัดโดย {tournament.organizer.gamerTag}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold text-white mt-1">
                        {tournament.name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-4">
                      {championTeam && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2 text-right">
                          <span className="text-[11px] uppercase tracking-wider text-amber-400 block">
                            Champion
                          </span>
                          <span className="text-base font-bold text-white">
                            [{championTeam.tag}] {championTeam.name}
                          </span>
                        </div>
                      )}

                      {isOrganizer && (
                        <DeleteTournamentButton tournamentId={tournament.id} />
                      )}
                    </div>
                  </div>

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
                      } gap-6 overflow-x-auto`}
                    >
                      {rounds.map((round) => {
                        const roundMatches = tournament.matches.filter(
                          (m) => m.round === round,
                        );

                        return (
                          <div key={round} className="flex flex-col space-y-3">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              {getRoundLabel(round, totalRounds)}
                            </h3>

                            <div className="flex-1 flex flex-col justify-around gap-4">
                              {roundMatches.map((match) => {
                                const isReady = Boolean(
                                  match.teamAId && match.teamBId,
                                );
                                const canSubmit =
                                  isOrganizer && isReady && !match.winnerId;

                                return (
                                  <div
                                    key={match.id}
                                    className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-1.5"
                                  >
                                    <div
                                      className={`flex items-center justify-between px-2 py-1 rounded text-xs ${
                                        match.winnerId &&
                                        match.winnerId === match.teamAId
                                          ? "bg-emerald-500/15 text-emerald-300 font-bold"
                                          : "text-zinc-300"
                                      }`}
                                    >
                                      <span className="truncate">
                                        {match.teamA ? (
                                          <>
                                            <span className="text-zinc-500 mr-1">
                                              [{match.teamA.tag}]
                                            </span>
                                            {match.teamA.name}
                                          </>
                                        ) : (
                                          <span className="text-zinc-600 italic">
                                            TBD
                                          </span>
                                        )}
                                      </span>
                                      <span className="font-mono ml-2">
                                        {match.winnerId ? match.scoreA : "-"}
                                      </span>
                                    </div>

                                    <div
                                      className={`flex items-center justify-between px-2 py-1 rounded text-xs ${
                                        match.winnerId &&
                                        match.winnerId === match.teamBId
                                          ? "bg-emerald-500/15 text-emerald-300 font-bold"
                                          : "text-zinc-300"
                                      }`}
                                    >
                                      <span className="truncate">
                                        {match.teamB ? (
                                          <>
                                            <span className="text-zinc-500 mr-1">
                                              [{match.teamB.tag}]
                                            </span>
                                            {match.teamB.name}
                                          </>
                                        ) : (
                                          <span className="text-zinc-600 italic">
                                            TBD
                                          </span>
                                        )}
                                      </span>
                                      <span className="font-mono ml-2">
                                        {match.winnerId ? match.scoreB : "-"}
                                      </span>
                                    </div>

                                    {isReady && (
                                      <div className="pt-1 flex items-center justify-between text-[11px] gap-2">
                                        <span className="text-zinc-500 truncate">
                                          <strong className="text-zinc-400 mr-1">
                                            BO{match.bestOf}
                                          </strong>
                                          {match.pickedMaps.length > 0
                                            ? `• ${match.pickedMaps.join(", ")}`
                                            : `• Veto (${match.bannedMaps.length} banned)`}
                                        </span>
                                        <Link
                                          href={`/matches/${match.id}`}
                                          className="text-indigo-400 hover:text-indigo-300 font-medium shrink-0"
                                        >
                                          ห้องแข่งขัน / Veto →
                                        </Link>
                                      </div>
                                    )}

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
      </div>
    </main>
  );
}
