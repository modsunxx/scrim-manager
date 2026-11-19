"use server";

import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export type AuthState = {
  error?: string;
};

export async function registerUser(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const gamerTag = (formData.get("gamerTag") as string)?.trim();
  const password = formData.get("password") as string;
  const role = formData.get("role") === "ORGANIZER" ? "ORGANIZER" : "USER";

  if (!email || !gamerTag || !password) {
    return { error: "กรุณากรอกข้อมูลให้ครบทุกช่อง" };
  }

  if (password.length < 6) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { gamerTag }] },
  });

  if (existing) {
    return { error: "Email หรือ GamerTag นี้ถูกใช้งานแล้ว" };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      gamerTag,
      passwordHash,
      role,
    },
  });

  await createSession(user.id);
  redirect("/");
}

export async function loginUser(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "กรุณากรอก Email และรหัสผ่าน" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "ไม่พบบัญชีผู้ใช้นี้" };
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return { error: "รหัสผ่านไม่ถูกต้อง" };
  }

  await createSession(user.id);
  redirect("/");
}

export async function logoutUser() {
  await deleteSession();
  redirect("/login");
}
