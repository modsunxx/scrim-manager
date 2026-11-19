"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getNextVetoTurn, type VetoStepEntry } from "@/lib/veto";
import { revalidatePath } from "next/cache";

export type ActionResponse = {
  success: boolean;
  message: string;
};

// 1. กัปตันกด BAN หรือ PICK แผนที่ในคิวของตัวเอง
export async function performMapVeto(
  matchId: string,
  mapName: string,
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "กรุณาเข้าสู่ระบบ" };

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: true,
      teamA: { include: { members: true } },
      teamB: { include: { members: true } },
    },
  });

  if (!match || !match.teamA || !match.teamB) {
    return { success: false, message: "ไม่พบข้อมูลแมตช์" };
  }

  if (match.winnerId) {
    return { success: false, message: "แมตช์นี้จบการแข่งขันแล้ว" };
  }

  const vetoLog = (
    Array.isArray(match.vetoLog) ? match.vetoLog : []
  ) as VetoStepEntry[];
  const nextTurn = getNextVetoTurn(
    match.bestOf,
    match.tournament.game,
    vetoLog,
  );

  if (nextTurn.kind !== "MAP") {
    return {
      success: false,
      message:
        nextTurn.kind === "SIDE"
          ? `กรุณาเลือกฝั่งเริ่มเกมสำหรับแผนที่ ${nextTurn.map} ก่อน`
          : "การเลือกแผนที่สิ้นสุดลงแล้ว",
    };
  }

  const usedMaps = new Set([...match.bannedMaps, ...match.pickedMaps]);
  if (!match.mapPool.includes(mapName) || usedMaps.has(mapName)) {
    return { success: false, message: "แผนที่นี้ถูกเลือกหรือแบนไปแล้ว" };
  }

  const activeTeam = nextTurn.team === "A" ? match.teamA : match.teamB;
  const isCaptainOfTurn = activeTeam.members.some(
    (m) => m.userId === user.id && m.role === "CAPTAIN",
  );
  const isOrganizer = user.role === "ORGANIZER";

  if (!isCaptainOfTurn && !isOrganizer) {
    return {
      success: false,
      message: `ขณะนี้เป็นคิว ${nextTurn.action} ของทีม [${activeTeam.tag}]`,
    };
  }

  const updatedLog: VetoStepEntry[] = [
    ...vetoLog,
    {
      type: nextTurn.action,
      map: mapName,
      byTeam: nextTurn.team,
    },
  ];

  const updatedBanned =
    nextTurn.action === "BAN"
      ? [...match.bannedMaps, mapName]
      : [...match.bannedMaps];
  const updatedPicked =
    nextTurn.action === "PICK"
      ? [...match.pickedMaps, mapName]
      : [...match.pickedMaps];

  // เช็กว่าเหลือแผนที่ใบสุดท้ายเป็น Decider หรือยัง
  const allUsed = new Set([...updatedBanned, ...updatedPicked]);
  const remaining = match.mapPool.filter((m) => !allUsed.has(m));

  if (remaining.length === 1) {
    const deciderMap = remaining[0];
    updatedPicked.push(deciderMap);
    updatedLog.push({
      type: "DECIDER",
      map: deciderMap,
      byTeam: "SYSTEM",
    });
  }

  await prisma.match.update({
    where: { id: matchId },
    data: {
      bannedMaps: updatedBanned,
      pickedMaps: updatedPicked,
      vetoLog: updatedLog,
    },
  });

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/tournaments");
  return {
    success: true,
    message: `${nextTurn.action} แผนที่ ${mapName} เรียบร้อย`,
  };
}

// 2. กัปตันกดเลือกฝั่งเริ่มเกม (CT / T หรือ Attack / Defense)
export async function selectStartingSide(
  matchId: string,
  chosenSide: string,
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "กรุณาเข้าสู่ระบบ" };

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: true,
      teamA: { include: { members: true } },
      teamB: { include: { members: true } },
    },
  });

  if (!match || !match.teamA || !match.teamB) {
    return { success: false, message: "ไม่พบข้อมูลแมตช์" };
  }

  const vetoLog = (
    Array.isArray(match.vetoLog) ? match.vetoLog : []
  ) as VetoStepEntry[];
  const nextTurn = getNextVetoTurn(
    match.bestOf,
    match.tournament.game,
    vetoLog,
  );

  if (nextTurn.kind !== "SIDE") {
    return { success: false, message: "ไม่อยู่ในขั้นตอนเลือกฝั่งเริ่มเกม" };
  }

  if (!nextTurn.options.includes(chosenSide)) {
    return { success: false, message: "ตัวเลือกฝั่งไม่ถูกต้อง" };
  }

  const activeTeam = nextTurn.team === "A" ? match.teamA : match.teamB;
  const isCaptainOfTurn = activeTeam.members.some(
    (m) => m.userId === user.id && m.role === "CAPTAIN",
  );
  const isOrganizer = user.role === "ORGANIZER";

  if (!isCaptainOfTurn && !isOrganizer) {
    return {
      success: false,
      message: `ขณะนี้เป็นคิวเลือกฝั่งของทีม [${activeTeam.tag}]`,
    };
  }

  // อัปเดต chosenSide ลงในรายการ PICK/DECIDER ล่าสุดที่ยังไม่มีฝั่ง
  let updated = false;
  const updatedLog = vetoLog.map((entry) => {
    if (
      !updated &&
      (entry.type === "PICK" || entry.type === "DECIDER") &&
      !entry.chosenSide
    ) {
      updated = true;
      return {
        ...entry,
        sideByTeam: nextTurn.team,
        chosenSide,
      };
    }
    return entry;
  });

  await prisma.match.update({
    where: { id: matchId },
    data: { vetoLog: updatedLog },
  });

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/tournaments");
  return {
    success: true,
    message: `ทีม [${activeTeam.tag}] เลือกฝั่ง ${chosenSide} สำหรับ ${nextTurn.map}`,
  };
}

// 3. อัปเดตข้อมูลห้องแข่งขัน (Server IP / Lobby Code)
export async function updateMatchLobbyInfo(
  _prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "กรุณาเข้าสู่ระบบ" };

  const matchId = formData.get("matchId") as string;
  const lobbyInfo = (formData.get("lobbyInfo") as string)?.trim() || null;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      teamA: { include: { members: true } },
      teamB: { include: { members: true } },
    },
  });

  if (!match) return { success: false, message: "ไม่พบแมตช์" };

  const isCaptainA = match.teamA?.members.some(
    (m) => m.userId === user.id && m.role === "CAPTAIN",
  );
  const isCaptainB = match.teamB?.members.some(
    (m) => m.userId === user.id && m.role === "CAPTAIN",
  );

  if (user.role !== "ORGANIZER" && !isCaptainA && !isCaptainB) {
    return { success: false, message: "ไม่มีสิทธิ์แก้ไขข้อมูลห้องแข่งขันนี้" };
  }

  await prisma.match.update({
    where: { id: matchId },
    data: { lobbyInfo },
  });

  revalidatePath(`/matches/${matchId}`);
  return { success: true, message: "อัปเดตข้อมูล Lobby / Server เรียบร้อย" };
}
