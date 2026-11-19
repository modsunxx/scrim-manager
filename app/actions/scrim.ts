"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

export type ActionResponse = {
  success: boolean;
  message: string;
};

// ตัวช่วยตรวจสอบว่าผู้ใช้ปัจจุบันเป็น CAPTAIN ของทีมที่ระบุหรือไม่
async function verifyTeamCaptain(teamId: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const membership = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId: user.id,
        teamId,
      },
    },
  });

  if (!membership || membership.role !== "CAPTAIN") return null;
  return user;
}

// 1. สร้างประกาศหาคู่ซ้อม (เฉพาะ Captain ของทีม)
export async function createScrim(
  _prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const hostTeamId = formData.get("hostTeamId") as string;
  const startTimeRaw = formData.get("startTime") as string;
  const durationMinutes = Number(formData.get("durationMinutes") || 60);
  const mapPool = formData.getAll("mapPool") as string[];
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!hostTeamId || !startTimeRaw) {
    return {
      success: false,
      message: "กรุณาเลือกทีมและเวลาเริ่มซ้อมให้ครบถ้วน",
    };
  }

  const captain = await verifyTeamCaptain(hostTeamId);
  if (!captain) {
    return {
      success: false,
      message: "เฉพาะหัวหน้าทีม (Captain) เท่านั้นที่ลงประกาศซ้อมได้",
    };
  }

  const startTime = new Date(startTimeRaw);
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  if (Number.isNaN(startTime.getTime())) {
    return { success: false, message: "รูปแบบวันเวลาไม่ถูกต้อง" };
  }

  // ตรวจสอบเวลาซ้ำซ้อนของทีมเจ้าบ้าน
  const overlappingScrim = await prisma.scrim.findFirst({
    where: {
      status: { in: ["OPEN", "CONFIRMED"] },
      OR: [{ hostTeamId }, { guestTeamId: hostTeamId }],
      AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
    },
  });

  if (overlappingScrim) {
    return {
      success: false,
      message: "ทีมของคุณมีคิวซ้อมในช่วงเวลานี้อยู่แล้ว กรุณาเลือกเวลาอื่น",
    };
  }

  await prisma.scrim.create({
    data: {
      hostTeamId,
      startTime,
      endTime,
      mapPool: mapPool.length > 0 ? mapPool : ["Mirage", "Inferno", "Ancient"],
      notes,
      status: "OPEN",
    },
  });

  revalidatePath("/scrims");
  revalidatePath("/");
  return { success: true, message: "ลงประกาศหาคู่ซ้อมสำเร็จ!" };
}

// 2. กดรับคำท้าซ้อม (เฉพาะ Captain ของทีมที่รับคำท้า)
export async function acceptScrim(
  _prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const scrimId = formData.get("scrimId") as string;
  const guestTeamId = formData.get("guestTeamId") as string;

  if (!scrimId || !guestTeamId) {
    return { success: false, message: "กรุณาเลือกทีมของคุณก่อนกดรับคำท้า" };
  }

  const captain = await verifyTeamCaptain(guestTeamId);
  if (!captain) {
    return {
      success: false,
      message: "เฉพาะหัวหน้าทีม (Captain) เท่านั้นที่กดรับคำท้าได้",
    };
  }

  const scrim = await prisma.scrim.findUnique({
    where: { id: scrimId },
  });

  if (!scrim || scrim.status !== "OPEN") {
    return { success: false, message: "ห้องซ้อมนี้ถูกจองไปแล้วหรือถูกยกเลิก" };
  }

  if (scrim.hostTeamId === guestTeamId) {
    return { success: false, message: "ไม่สามารถรับคำท้าทีมตัวเองได้" };
  }

  // ตรวจสอบว่าทีมผู้ท้าชิงติดคิวซ้อมอื่นในช่วงเวลานี้หรือไม่
  const conflict = await prisma.scrim.findFirst({
    where: {
      status: { in: ["OPEN", "CONFIRMED"] },
      OR: [{ hostTeamId: guestTeamId }, { guestTeamId }],
      AND: [
        { startTime: { lt: scrim.endTime } },
        { endTime: { gt: scrim.startTime } },
      ],
    },
  });

  if (conflict) {
    return {
      success: false,
      message: "ทีมของคุณมีตารางซ้อมซ้อนทับในช่วงเวลานี้",
    };
  }

  await prisma.scrim.update({
    where: { id: scrimId },
    data: {
      guestTeamId,
      status: "CONFIRMED",
    },
  });

  revalidatePath("/scrims");
  revalidatePath("/");
  return { success: true, message: "ยืนยันการจับคู่ซ้อมเรียบร้อย!" };
}

// 3. ยกเลิกห้องซ้อม (เฉพาะ Captain ของทีมเจ้าบ้าน)
export async function cancelScrim(scrimId: string) {
  const scrim = await prisma.scrim.findUnique({
    where: { id: scrimId },
  });
  if (!scrim) return;

  const captain = await verifyTeamCaptain(scrim.hostTeamId);
  if (!captain) return;

  await prisma.scrim.update({
    where: { id: scrimId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/scrims");
  revalidatePath("/");
}
