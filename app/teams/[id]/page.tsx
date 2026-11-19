import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function TeamProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [currentUser, team] = await Promise.all([
    getCurrentUser(),
    prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, gamerTag: true, email: true } },
          },
          orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
        },
        matchesAsA: {
          include: {
            tournament: true,
            teamA: { select: { id: true, name: true, tag: true } },
            teamB: { select: { id: true, name: true, tag: true } },
          },
        },
        matchesAsB: {
          include: {
            tournament: true,
            teamA: { select: { id: true, name: true, tag: true } },
            teamB: { select: { id: true, name: true, tag: true } },
          },
        },
        hostScrims: {
          where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
          include: {
            hostTeam: { select: { id: true, name: true, tag: true } },
            guestTeam: { select: { id: true, name: true, tag: true } },
          },
        },
        guestScrims: {
          where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
          include: {
            hostTeam: { select: { id: true, name: true, tag: true } },
            guestTeam: { select: { id: true, name: true, tag: true } },
          },
        },
      },
    }),
  ]);

  if (!team) {
    notFound();
  }

  const isCaptain = team.members.some(
    (m) => m.userId === currentUser?.id && m.role === "CAPTAIN",
  );

  // รวมแมตช์ทัวร์นาเมนต์ทั้งหมดของทีม
  const allMatches = [...team.matchesAsA, ...team.matchesAsB].sort(
    (a, b) => b.round - a.round,
  );
  const completedMatches = allMatches.filter((m) => Boolean(m.winnerId));
  const wins = completedMatches.filter((m) => m.winnerId === team.id).length;
  const losses = completedMatches.length - wins;
  const winRate =
    completedMatches.length > 0
      ? Math.round((wins / completedMatches.length) * 100)
      : 0;

  // นับจำนวนแชมป์ทัวร์นาเมนต์ (ชนะในรอบ Grand Final)
  const championships = completedMatches.filter((m) => {
    const totalRounds = Math.log2(m.tournament.maxTeams);
    return m.round === totalRounds && m.winnerId === team.id;
  }).length;

  // คำนวณสถิติแผนที่ที่ทีมลงแข่งบ่อยและชนะบ่อย
  const mapStatsMap = new Map<string, { played: number; won: number }>();
  for (const match of completedMatches) {
    const isWin = match.winnerId === team.id;
    for (const map of match.pickedMaps) {
      const current = mapStatsMap.get(map) ?? { played: 0, won: 0 };
      mapStatsMap.set(map, {
        played: current.played + 1,
        won: current.won + (isWin ? 1 : 0),
      });
    }
  }

  const mapStats = Array.from(mapStatsMap.entries())
    .map(([map, stat]) => ({
      map,
      played: stat.played,
      won: stat.won,
      winRate: Math.round((stat.won / stat.played) * 100),
    }))
    .sort((a, b) => b.played - a.played || b.winRate - a.winRate);

  // รวมประวัติ Scrim ที่ยืนยันแล้ว
  const allScrims = [...team.hostScrims, ...team.guestScrims].sort(
    (a, b) => b.startTime.getTime() - a.startTime.getTime(),
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <Link
              href="/teams"
              className="text-xs text-zinc-400 hover:text-white transition"
            >
              ← กลับหน้ารวมทีม
            </Link>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg">
                [{team.tag}]
              </span>
              <h1 className="text-3xl font-bold text-white">{team.name}</h1>
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              ก่อตั้งเมื่อ {formatDate(team.createdAt)} • สมาชิกทั้งหมด{" "}
              {team.members.length} คน
            </p>
          </div>

          {isCaptain && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-right">
              <span className="text-[11px] text-zinc-400 block">
                Team Invite Code (สำหรับกัปตัน)
              </span>
              <code className="text-sm font-mono font-bold text-emerald-400 select-all">
                {team.inviteCode}
              </code>
            </div>
          )}
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <span className="text-xs text-zinc-400">Tournament Win Rate</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {winRate}%
            </div>
            <span className="text-[11px] text-zinc-500">
              ชนะ {wins} / แพ้ {losses} แมตช์
            </span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <span className="text-xs text-zinc-400">แชมป์รายการแข่งขัน</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">
              {championships} รายการ
            </div>
            <span className="text-[11px] text-zinc-500">
              Grand Final Victories
            </span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <span className="text-xs text-zinc-400">คิวซ้อม (Scrims)</span>
            <div className="text-2xl font-bold text-indigo-400 mt-1">
              {allScrims.length} นัด
            </div>
            <span className="text-[11px] text-zinc-500">
              Confirmed & Completed
            </span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <span className="text-xs text-zinc-400">แผนที่ถนัดที่สุด</span>
            <div className="text-xl font-bold text-white mt-1 truncate">
              {mapStats[0] ? mapStats[0].map : "-"}
            </div>
            <span className="text-[11px] text-zinc-500">
              {mapStats[0]
                ? `Win Rate ${mapStats[0].winRate}% (${mapStats[0].played} เกม)`
                : "ยังไม่มีข้อมูลแผนที่"}
            </span>
          </div>
        </div>

        {/* Roster & Map Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Roster */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-white">
              รายชื่อผู้เล่นในทีม (Active Roster)
            </h2>
            <ul className="space-y-2">
              {team.members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between bg-zinc-950 border border-zinc-800/80 rounded-lg px-3.5 py-2.5 text-xs"
                >
                  <div>
                    <span className="font-semibold text-zinc-100">
                      {member.user.gamerTag}
                    </span>
                    <span className="text-zinc-500 block text-[11px]">
                      เข้าร่วมเมื่อ {formatDate(member.joinedAt)}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      member.role === "CAPTAIN"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        : member.role === "SUB"
                          ? "bg-zinc-800 text-zinc-400"
                          : "bg-emerald-500/10 text-emerald-400"
                    }`}
                  >
                    {member.role}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Map Statistics */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-white">
              สถิติแผนที่ในทัวร์นาเมนต์ (Map Stats)
            </h2>
            {mapStats.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">
                ยังไม่มีประวัติการแข่งขันที่บันทึกผลแล้ว
              </p>
            ) : (
              <div className="space-y-3">
                {mapStats.map((stat) => (
                  <div
                    key={stat.map}
                    className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{stat.map}</span>
                      <span className="text-zinc-400">
                        ชนะ {stat.won} / {stat.played} เกม ({stat.winRate}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${stat.winRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ประวัติการแข่งทัวร์นาเมนต์ */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-white">
            ประวัติการแข่งขันทัวร์นาเมนต์ ({allMatches.length})
          </h2>

          {allMatches.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">
              ทีมนี้ยังไม่เคยลงแข่งขันในทัวร์นาเมนต์
            </p>
          ) : (
            <div className="space-y-2.5">
              {allMatches.map((match) => {
                const isTeamA = match.teamAId === team.id;
                const opponent = isTeamA ? match.teamB : match.teamA;
                const myScore = isTeamA ? match.scoreA : match.scoreB;
                const oppScore = isTeamA ? match.scoreB : match.scoreA;
                const isFinished = Boolean(match.winnerId);
                const isWin = match.winnerId === team.id;

                return (
                  <div
                    key={match.id}
                    className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950 border border-zinc-800/80 rounded-lg px-4 py-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-semibold">
                          {match.tournament.name}
                        </span>
                        <span className="text-zinc-500">
                          • Round {match.round}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white">
                        VS{" "}
                        {opponent ? (
                          <Link
                            href={`/teams/${opponent.id}`}
                            className="hover:text-emerald-400 transition"
                          >
                            [{opponent.tag}] {opponent.name}
                          </Link>
                        ) : (
                          <span className="text-zinc-500 italic">TBD</span>
                        )}
                      </div>
                      {match.pickedMaps.length > 0 && (
                        <div className="text-[11px] text-zinc-400">
                          Maps: {match.pickedMaps.join(", ")}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      {isFinished ? (
                        <div className="text-right">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded ${
                              isWin
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-rose-500/15 text-rose-400"
                            }`}
                          >
                            {isWin ? "WIN" : "LOSS"}
                          </span>
                          <div className="text-base font-mono font-bold text-white mt-1">
                            {myScore} : {oppScore}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded">
                          กำลังแข่งขัน
                        </span>
                      )}

                      {match.teamAId && match.teamBId && (
                        <Link
                          href={`/matches/${match.id}`}
                          className="text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          ดูห้องแข่ง →
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ประวัติการซ้อม (Scrim History) */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-white">
            ประวัติการนัดซ้อม (Confirmed Scrims: {allScrims.length})
          </h2>

          {allScrims.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">
              ยังไม่มีประวัติการซ้อมที่ยืนยันแล้ว
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allScrims.map((scrim) => {
                const opponent =
                  scrim.hostTeamId === team.id
                    ? scrim.guestTeam
                    : scrim.hostTeam;

                return (
                  <div
                    key={scrim.id}
                    className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3.5 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">
                        VS{" "}
                        {opponent ? (
                          <Link
                            href={`/teams/${opponent.id}`}
                            className="text-indigo-400 hover:underline"
                          >
                            [{opponent.tag}] {opponent.name}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {formatDateTime(scrim.startTime)}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Maps: {scrim.mapPool.join(", ")}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
