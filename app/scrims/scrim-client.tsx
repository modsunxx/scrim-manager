"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  acceptScrim,
  cancelScrim,
  createScrim,
  type ActionResponse,
} from "@/app/actions/scrim";

type TeamOption = {
  id: string;
  name: string;
  tag: string;
};

const AVAILABLE_MAPS = [
  "Mirage",
  "Inferno",
  "Nuke",
  "Overpass",
  "Vertigo",
  "Ancient",
  "Anubis",
];

const initialState: ActionResponse = { success: false, message: "" };

export function CreateScrimForm({
  captainTeams,
  isLoggedIn,
}: {
  captainTeams: TeamOption[];
  isLoggedIn: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, action, isPending] = useActionState(createScrim, initialState);

  if (!isLoggedIn) {
    return (
      <div className="border border-zinc-800 bg-zinc-900/40 p-5 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span
            className="font-mono text-[10px] font-semibold tracking-[0.18em] uppercase text-zinc-500 block mb-1"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Authentication Required
          </span>
          <p className="text-sm text-zinc-200 font-medium">
            เข้าสู่ระบบเพื่อลงประกาศหาคู่ซ้อม
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            เฉพาะบัญชีที่เป็นหัวหน้าทีม (Captain) จึงจะลงประกาศและรับคำท้าได้
          </p>
        </div>
        <Link
          href="/login"
          className="border border-violet-500/40 bg-violet-950/20 hover:bg-violet-950/40 text-violet-400 font-mono text-xs font-semibold px-4 py-2 uppercase tracking-widest transition-colors"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          [ เข้าสู่ระบบ → ]
        </Link>
      </div>
    );
  }

  if (captainTeams.length === 0) {
    return (
      <div className="border border-zinc-800 bg-zinc-900/40 p-5 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span
            className="font-mono text-[10px] font-semibold tracking-[0.18em] uppercase text-zinc-500 block mb-1"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Captain Role Required
          </span>
          <p className="text-sm text-zinc-200 font-medium">
            คุณยังไม่มีทีมที่เป็นหัวหน้าทีม (Captain)
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            สร้างทีมใหม่เพื่อรับสิทธิ์ Captain หรือให้หัวหน้าทีมเป็นผู้ลงประกาศ
          </p>
        </div>
        <Link
          href="/teams"
          className="border border-cyan-500/40 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-400 font-mono text-xs font-semibold px-4 py-2 uppercase tracking-widest transition-colors"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          [ ไปสร้างทีมใหม่ → ]
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-zinc-800 bg-zinc-900/30 p-5 mb-8">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <div>
          <span
            className="font-mono text-[10px] font-semibold tracking-[0.18em] uppercase text-violet-400 block"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Scrim Matchmaking
          </span>
          <h2 className="text-base font-bold text-white mt-0.5">
            ลงประกาศหาคู่ซ้อม (Post Scrim Request)
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="border border-zinc-800 hover:border-violet-500/50 text-zinc-400 hover:text-violet-300 font-mono text-xs uppercase tracking-widest px-3 py-1.5 transition-colors"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {isOpen ? "[ ซ่อนฟอร์ม ▲ ]" : "[ + เปิดฟอร์มหาคู่ซ้อม ▼ ]"}
        </button>
      </div>

      {isOpen && (
        <form action={action} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label
                className="block font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-1"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                ทีมของคุณ (Captain Teams)
              </label>
              <select
                name="hostTeamId"
                required
                className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-violet-500/60"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {captainTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    [{team.tag}] {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-1"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                วันและเวลาเริ่มซ้อม
              </label>
              <input
                type="datetime-local"
                name="startTime"
                required
                className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-violet-500/60"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              />
            </div>

            <div>
              <label
                className="block font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-1"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                ระยะเวลาซ้อม
              </label>
              <select
                name="durationMinutes"
                defaultValue="60"
                className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-violet-500/60"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                <option value="60">1 ชั่วโมง (BO1)</option>
                <option value="120">2 ชั่วโมง (BO2)</option>
                <option value="180">3 ชั่วโมง (BO3)</option>
              </select>
            </div>
          </div>

          <div>
            <label
              className="block font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-2"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              แผนที่ที่ต้องการซ้อม (Map Pool)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_MAPS.map((map) => (
                <label
                  key={map}
                  className="flex items-center gap-1.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-950 px-3 py-1 text-xs font-mono text-zinc-300 cursor-pointer select-none transition-colors"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  <input
                    type="checkbox"
                    name="mapPool"
                    value={map}
                    defaultChecked={["Mirage", "Inferno", "Ancient"].includes(
                      map,
                    )}
                    className="accent-violet-500"
                  />
                  {map}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label
              className="block font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-1"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              หมายเหตุ / ข้อกำหนด (Notes)
            </label>
            <input
              name="notes"
              placeholder="เช่น ขอทีมแรงก์ FACEIT Lv.7+ หรือซ้อมแผนบุก Site A"
              className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-violet-500/60"
            />
          </div>

          {state.message && (
            <p
              className={`font-mono text-xs ${
                state.success ? "text-cyan-400" : "text-rose-400"
              }`}
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {state.message}
            </p>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="border border-violet-500/60 bg-violet-950/30 hover:bg-violet-900/40 text-violet-300 font-mono text-xs font-bold uppercase tracking-widest px-5 py-2 transition-colors disabled:opacity-40"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {isPending ? "กำลังลงประกาศ..." : "ยืนยันลงประกาศหาคู่ซ้อม →"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function AcceptScrimForm({
  scrimId,
  hostTeamId,
  captainTeams,
}: {
  scrimId: string;
  hostTeamId: string;
  captainTeams: TeamOption[];
}) {
  const [state, action, isPending] = useActionState(acceptScrim, initialState);

  const eligibleTeams = captainTeams.filter((t) => t.id !== hostTeamId);

  if (eligibleTeams.length === 0) {
    return null;
  }

  return (
    <form
      action={action}
      className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="scrimId" value={scrimId} />
      <select
        name="guestTeamId"
        required
        className="flex-1 min-w-[200px] bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500/60"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        {eligibleTeams.map((team) => (
          <option key={team.id} value={team.id}>
            [{team.tag}] {team.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="border border-cyan-500/60 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 font-mono text-xs font-bold uppercase tracking-widest px-4 py-1.5 transition-colors disabled:opacity-40 whitespace-nowrap"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        {isPending ? "…" : "รับคำท้า"}
      </button>
      {state.message && !state.success && (
        <p
          className="w-full font-mono text-[10px] text-rose-400 mt-1"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

export function CancelScrimButton({ scrimId }: { scrimId: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (confirm("ยืนยันการยกเลิกประกาศซ้อมนี้?")) {
          cancelScrim(scrimId);
        }
      }}
      className="font-mono text-[10px] text-zinc-600 hover:text-rose-400 tracking-widest uppercase transition-colors"
      style={{ fontFamily: "var(--font-geist-mono)" }}
    >
      [ CANCEL ]
    </button>
  );
}
