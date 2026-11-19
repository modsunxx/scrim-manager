"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

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

// 1. สร้างทีมใหม่ พร้อมตั้งบัญชีที่ล็อกอินอยู่เป็น CAPTAIN
export async function createTeam(
  _prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "กรุณาเข้าสู่ระบบก่อนสร้างทีม" };
  }

  const name = (formData.get("name") as string)?.trim();
  const tag = (formData.get("tag") as string)?.trim().toUpperCase();

  if (!name || !tag) {
    return { success: false, message: "กรุณากรอกชื่อทีมและ Team Tag ให้ครบ" };
  }

  if (tag.length > 5) {
    return { success: false, message: "Team Tag ต้องยาวไม่เกิน 5 ตัวอักษร" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name,
          tag,
        },
      });

      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId: user.id,
          role: "CAPTAIN",
        },
      });
    });

    revalidatePath("/teams");
    revalidatePath("/");
    return { success: true, message: `สร้างทีม [${tag}] ${name} สำเร็จ!` };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { success: false, message: "ชื่อทีมนี้ถูกใช้งานแล้ว" };
    }
    return { success: false, message: "เกิดข้อผิดพลาดในการสร้างทีม" };
  }
}

// 2. เข้าร่วมทีมด้วย Invite Code
export async function joinTeamByCode(
  _prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "กรุณาเข้าสู่ระบบก่อนเข้าร่วมทีม" };
  }

  const inviteCode = (formData.get("inviteCode") as string)?.trim();
  if (!inviteCode) {
    return { success: false, message: "กรุณากรอก Invite Code" };
  }

  try {
    const team = await prisma.team.findUnique({
      where: { inviteCode },
      include: { members: true },
    });

    if (!team) {
      return { success: false, message: "ไม่พบทีมที่ใช้ Invite Code นี้" };
    }

    const alreadyJoined = team.members.some((m) => m.userId === user.id);
    if (alreadyJoined) {
      return { success: false, message: `คุณอยู่ในทีม ${team.name} แล้ว` };
    }

    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: user.id,
        role: "PLAYER",
      },
    });

    revalidatePath("/teams");
    return {
      success: true,
      message: `เข้าร่วมทีม [${team.tag}] ${team.name} สำเร็จ!`,
    };
  } catch {
    return { success: false, message: "ไม่สามารถเข้าร่วมทีมได้" };
  }
}

// 3. รีเซ็ต Invite Code ใหม่ (เฉพาะ Captain ของทีม)
export async function regenerateInviteCode(teamId: string) {
  const captain = await verifyTeamCaptain(teamId);
  if (!captain) return;

  const newCode = crypto.randomBytes(4).toString("hex");
  await prisma.team.update({
    where: { id: teamId },
    data: { inviteCode: newCode },
  });
  revalidatePath("/teams");
}

// 4. เปลี่ยนตำแหน่งผู้เล่น (เฉพาะ Captain ของทีม)
export async function updateMemberRole(memberId: string, role: string) {
  const targetMember = await prisma.teamMember.findUnique({
    where: { id: memberId },
  });
  if (!targetMember) return;

  const captain = await verifyTeamCaptain(targetMember.teamId);
  if (!captain) return;

  await prisma.teamMember.update({
    where: { id: memberId },
    data: { role },
  });
  revalidatePath("/teams");
}

// 5. เตะสมาชิกออกจากทีม (เฉพาะ Captain ของทีม และห้ามเตะตัวเอง)
export async function removeMember(memberId: string) {
  const targetMember = await prisma.teamMember.findUnique({
    where: { id: memberId },
  });
  if (!targetMember) return;

  const captain = await verifyTeamCaptain(targetMember.teamId);
  if (!captain || targetMember.userId === captain.id) return;

  await prisma.teamMember.delete({
    where: { id: memberId },
  });
  revalidatePath("/teams");
}

// 6. ลบทีม (เฉพาะ Captain ของทีม)
export async function deleteTeam(teamId: string) {
  const captain = await verifyTeamCaptain(teamId);
  if (!captain) return;

  await prisma.team.delete({
    where: { id: teamId },
  });
  revalidatePath("/teams");
  revalidatePath("/tournaments");
  revalidatePath("/");
}
