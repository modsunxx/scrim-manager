"use client";

import { useActionState, useState } from "react";
import { loginUser, registerUser, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = {};

export default function LoginPage() {
  const [mode, setMode] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [loginState, loginAction, isLoggingIn] = useActionState(
    loginUser,
    initialState,
  );
  const [regState, regAction, isRegistering] = useActionState(
    registerUser,
    initialState,
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-white">
            Scrim & Bracket Manager
          </h1>
          <p className="text-xs text-zinc-400">
            {mode === "LOGIN"
              ? "เข้าสู่ระบบเพื่อจัดการทีมและตารางแข่งขัน"
              : "สร้างบัญชีผู้เล่นหรือผู้จัดการแข่งขัน"}
          </p>
        </div>

        {/* ปุ่มสลับโหมด Login / Register */}
        <div className="grid grid-cols-2 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode("LOGIN")}
            className={`py-2 rounded-md transition ${
              mode === "LOGIN" ? "bg-zinc-800 text-white" : "text-zinc-400"
            }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            onClick={() => setMode("REGISTER")}
            className={`py-2 rounded-md transition ${
              mode === "REGISTER" ? "bg-zinc-800 text-white" : "text-zinc-400"
            }`}
          >
            สมัครสมาชิกใหม่
          </button>
        </div>

        {mode === "LOGIN" ? (
          <form action={loginAction} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Email</label>
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                รหัสผ่าน
              </label>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {loginState.error && (
              <p className="text-xs text-rose-400">{loginState.error}</p>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg text-sm transition"
            >
              {isLoggingIn ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        ) : (
          <form action={regAction} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                GamerTag (ชื่อในเกม)
              </label>
              <input
                name="gamerTag"
                required
                placeholder="เช่น sxnnyp"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Email</label>
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                รหัสผ่าน (6 ตัวขึ้นไป)
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                บทบาทบัญชี (Account Role)
              </label>
              <select
                name="role"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="USER">
                  Player / Team Captain (ผู้เล่นและหัวหน้าทีม)
                </option>
                <option value="ORGANIZER">
                  Tournament Organizer (ผู้จัดการแข่งขัน)
                </option>
              </select>
            </div>

            {regState.error && (
              <p className="text-xs text-rose-400">{regState.error}</p>
            )}

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg text-sm transition"
            >
              {isRegistering ? "กำลังสมัครสมาชิก..." : "สร้างบัญชี"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
