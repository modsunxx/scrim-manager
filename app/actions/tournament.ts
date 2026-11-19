"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export type ActionResponse = {
  success: boolean;
  message: string;
};

const GAME_MAP_POOLS: Record<string, string[]> = {
  CS2: ["Mirage", "Inferno", "Nuke", "Ancient", "Anubis", "Dust2", "Vertigo"],
  VALORANT: ["Ascent", "Bind", "Haven", "Split", "Lotus", "Sunset", "Abyss"],
  DOTA2: ["Captain's Mode"],
};

async function verifyOrganizer() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ORGANIZER") return null;
  return user;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function createTournament(
  _prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const organizer = await verifyOrganizer();
  if (!organizer) {
    return {
      success: false,
      message: "เฉพาะ Organizer เท่านั้นที่สร้างทัวร์นาเมนต์ได้",
    };
  }

  const name = (formData.get("name") as string)?.trim();
  const game = (formData.get("game") as string)?.trim() || "CS2";
  const maxTeams = Number(formData.get("maxTeams"));
  const minPlayers = Number(formData.get("minPlayers") || 1);
  const matchFormat = (formData.get("matchFormat") as string) || "FINAL_BO3";

  if (!name) {
    return { success: false, message: "กรุณากรอกชื่อทัวร์นาเมนต์" };
  }

  if (maxTeams !== 4 && maxTeams !== 8) {
    return { success: false, message: "รองรับขนาดสายการแข่งขัน 4 หรือ 8 ทีม" };
  }

  await prisma.tournament.create({
    data: {
      name,
      game,
      maxTeams,
      minPlayers,
      matchFormat,
      status: "REGISTRATION",
      organizerId: organizer.id,
    },
  });

  revalidatePath("/tournaments");
  revalidatePath("/");
  return { success: true, message: `เปิดรับสมัครรายการ "${name}" สำเร็จ!` };
}

export async function registerTeamToTournament(
  _prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "กรุณาเข้าสู่ระบบก่อนสมัครแข่งขัน" };
  }

  const tournamentId = formData.get("tournamentId") as string;
  const teamId = formData.get("teamId") as string;

  if (!tournamentId || !teamId) {
    return { success: false, message: "กรุณาเลือกทีมที่ต้องการส่งเข้าแข่งขัน" };
  }

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
  });

  if (!membership || membership.role !== "CAPTAIN") {
    return {
      success: false,
      message: "เฉพาะหัวหน้าทีม (Captain) เท่านั้นที่สมัครแข่งได้",
    };
  }

  const [tournament, team] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { registrations: true },
    }),
    prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    }),
  ]);

  if (!tournament || tournament.status !== "REGISTRATION") {
    return { success: false, message: "ทัวร์นาเมนต์นี้ปิดรับสมัครแล้ว" };
  }

  if (!team) {
    return { success: false, message: "ไม่พบข้อมูลทีม" };
  }

  if (team.members.length < tournament.minPlayers) {
    return {
      success: false,
      message: `ทีม [${team.tag}] มีสมาชิก ${team.members.length} คน (รายการนี้กำหนดขั้นต่ำ ${tournament.minPlayers} คน)`,
    };
  }

  if (tournament.registrations.length >= tournament.maxTeams) {
    return { success: false, message: "จำนวนทีมสมัครเต็มโควตาแล้ว" };
  }

  const alreadyRegistered = tournament.registrations.some(
    (r) => r.teamId === teamId,
  );
  if (alreadyRegistered) {
    return {
      success: false,
      message: `ทีม [${team.tag}] สมัครรายการนี้ไปแล้ว`,
    };
  }

  await prisma.tournamentRegistration.create({
    data: { tournamentId, teamId },
  });

  revalidatePath("/tournaments");
  return {
    success: true,
    message: `ส่งทีม [${team.tag}] ${team.name} เข้าร่วมสำเร็จ!`,
  };
}

export async function withdrawTeamFromTournament(
  tournamentId: string,
  teamId: string,
) {
  const user = await getCurrentUser();
  if (!user) return;

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
  });
  if (!membership || membership.role !== "CAPTAIN") return;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament || tournament.status !== "REGISTRATION") return;

  await prisma.tournamentRegistration.delete({
    where: { tournamentId_teamId: { tournamentId, teamId } },
  });

  revalidatePath("/tournaments");
}

export async function startTournamentBracket(tournamentId: string) {
  const organizer = await verifyOrganizer();
  if (!organizer) return;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { registrations: true },
  });

  if (
    !tournament ||
    tournament.status !== "REGISTRATION" ||
    tournament.registrations.length !== tournament.maxTeams
  ) {
    return;
  }

  const teamIds = tournament.registrations.map((r) => r.teamId);
  const shuffledTeams = shuffleArray(teamIds);
  const totalRounds = Math.log2(tournament.maxTeams);
  const defaultMapPool = GAME_MAP_POOLS[tournament.game] ?? GAME_MAP_POOLS.CS2;

  await prisma.$transaction(async (tx) => {
    await tx.tournament.update({
      where: { id: tournament.id },
      data: { status: "ONGOING" },
    });

    const matchesByRound: Record<number, { id: string }[]> = {};

    for (let round = totalRounds; round >= 1; round--) {
      const matchCountInRound = Math.pow(2, totalRounds - round);
      matchesByRound[round] = [];

      // กำหนด BO1 หรือ BO3 ตามรูปแบบที่ Organizer ตั้งไว้
      const bestOf =
        tournament.matchFormat === "ALL_BO3"
          ? 3
          : tournament.matchFormat === "FINAL_BO3" && round === totalRounds
            ? 3
            : 1;

      for (let position = 0; position < matchCountInRound; position++) {
        const nextRoundMatches = matchesByRound[round + 1];
        const nextMatchId = nextRoundMatches
          ? nextRoundMatches[Math.floor(position / 2)].id
          : null;

        const teamAId = round === 1 ? shuffledTeams[position * 2] : null;
        const teamBId = round === 1 ? shuffledTeams[position * 2 + 1] : null;

        const isSingleMapGame = defaultMapPool.length === 1;

        const createdMatch = await tx.match.create({
          data: {
            tournamentId: tournament.id,
            round,
            position,
            bestOf,
            teamAId,
            teamBId,
            nextMatchId,
            mapPool: defaultMapPool,
            pickedMaps: isSingleMapGame ? [defaultMapPool[0]] : [],
            vetoLog: isSingleMapGame
              ? [{ type: "DECIDER", map: defaultMapPool[0], byTeam: "SYSTEM" }]
              : [],
          },
        });

        matchesByRound[round].push({ id: createdMatch.id });
      }
    }
  });

  revalidatePath("/tournaments");
  revalidatePath("/");
}

export async function submitMatchScore(
  _prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const organizer = await verifyOrganizer();
  if (!organizer) {
    return {
      success: false,
      message: "เฉพาะ Organizer เท่านั้นที่บันทึกผลได้",
    };
  }

  const matchId = formData.get("matchId") as string;
  const scoreA = Number(formData.get("scoreA"));
  const scoreB = Number(formData.get("scoreB"));

  if (
    Number.isNaN(scoreA) ||
    Number.isNaN(scoreB) ||
    scoreA < 0 ||
    scoreB < 0
  ) {
    return { success: false, message: "กรุณากรอกคะแนนให้ถูกต้อง" };
  }

  if (scoreA === scoreB) {
    return { success: false, message: "รอบแพ้คัดออกห้ามเสมอกัน" };
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || !match.teamAId || !match.teamBId) {
    return { success: false, message: "คู่แข่งขันนี้ยังไม่ครบทั้ง 2 ทีม" };
  }

  if (match.winnerId) {
    return { success: false, message: "แมตช์นี้บันทึกผลไปแล้ว" };
  }

  const winnerId = scoreA > scoreB ? match.teamAId : match.teamBId;

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: matchId },
      data: { scoreA, scoreB, winnerId },
    });

    if (match.nextMatchId) {
      const isTopSlot = match.position % 2 === 0;
      await tx.match.update({
        where: { id: match.nextMatchId },
        data: isTopSlot ? { teamAId: winnerId } : { teamBId: winnerId },
      });
    } else {
      await tx.tournament.update({
        where: { id: match.tournamentId },
        data: { status: "FINISHED" },
      });
    }
  });

  revalidatePath("/tournaments");
  revalidatePath(`/matches/${matchId}`);
  return { success: true, message: "บันทึกผลและอัปเดตสายแข่งแล้ว" };
}

export async function fillDemoRegistrations(tournamentId: string) {
  const organizer = await verifyOrganizer();
  if (!organizer) return;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { registrations: true },
  });
  if (!tournament || tournament.status !== "REGISTRATION") return;

  const demoTeams = [
    { name: "Natus Vincere", tag: "NAVI" },
    { name: "Team Spirit", tag: "TS" },
    { name: "G2 Esports", tag: "G2" },
    { name: "FaZe Clan", tag: "FAZE" },
    { name: "Team Vitality", tag: "VIT" },
    { name: "MOUZ", tag: "MOUZ" },
    { name: "The MongolZ", tag: "MGLZ" },
    { name: "Paper Rex", tag: "PRX" },
  ];

  const defaultHash = await bcrypt.hash("demo1234", 10);
  const existingTeamIds = new Set(
    tournament.registrations.map((r) => r.teamId),
  );
  let slotsLeft = tournament.maxTeams - existingTeamIds.size;

  for (const t of demoTeams) {
    if (slotsLeft <= 0) break;

    const demoUser = await prisma.user.upsert({
      where: { email: `captain_${t.tag.toLowerCase()}@demo.local` },
      update: {},
      create: {
        email: `captain_${t.tag.toLowerCase()}@demo.local`,
        gamerTag: `${t.tag}_Leader`,
        passwordHash: defaultHash,
        role: "USER",
      },
    });

    const team = await prisma.team.upsert({
      where: { name: t.name },
      update: {},
      create: {
        name: t.name,
        tag: t.tag,
        members: {
          create: { userId: demoUser.id, role: "CAPTAIN" },
        },
      },
    });

    if (!existingTeamIds.has(team.id)) {
      await prisma.tournamentRegistration.create({
        data: { tournamentId: tournament.id, teamId: team.id },
      });
      existingTeamIds.add(team.id);
      slotsLeft--;
    }
  }

  revalidatePath("/tournaments");
  revalidatePath("/teams");
}

export async function deleteTournament(tournamentId: string) {
  const organizer = await verifyOrganizer();
  if (!organizer) return;

  await prisma.tournament.delete({ where: { id: tournamentId } });
  revalidatePath("/tournaments");
  revalidatePath("/");
}
