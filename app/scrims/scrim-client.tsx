"use client";

import { useActionState } from "react";
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
  const [state, action, isPending] = useActionState(createScrim, initialState);

  if (!isLoggedIn) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">
            เข้าสู่ระบบเพื่อลงประกาศหาคู่ซ้อม
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            เฉพาะบัญชีที่เป็นหัวหน้าทีม (Captain)
            เท่านั้นที่สามารถนัดซ้อมและกดรับคำท้าได้
          </p>
        </div>
        <Link
          href="/login"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition"
        >
          ไปหน้าเข้าสู่ระบบ →
        </Link>
      </div>
    );
  }

  if (captainTeams.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">
            คุณยังไม่ได้เป็นหัวหน้าทีม (Captain) ของทีมใด
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            สร้างทีมใหม่เพื่อรับสิทธิ์ Captain
            หรือให้หัวหน้าทีมของคุณเป็นผู้ลงประกาศหาคู่ซ้อม
          </p>
        </div>
        <Link
          href="/teams"
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition"
        >
          ไปสร้างทีมใหม่ →
        </Link>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5 mb-10"
    >
      <h2 className="text-lg font-semibold text-white">
        ลงประกาศหาคู่ซ้อม (Post Scrim)
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            ทีมของคุณ (เฉพาะทีมที่เป็น Captain)
          </label>
          <select
            name="hostTeamId"
            required
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            {captainTeams.map((team) => (
              <option key={team.id} value={team.id}>
                [{team.tag}] {team.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            วันและเวลาเริ่มซ้อม
          </label>
          <input
            type="datetime-local"
            name="startTime"
            required
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            ระยะเวลาซ้อม
          </label>
          <select
            name="durationMinutes"
            defaultValue="60"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="60">1 ชั่วโมง (BO1)</option>
            <option value="120">2 ชั่วโมง (BO2)</option>
            <option value="180">3 ชั่วโมง (BO3)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-2">
          แผนที่ที่ต้องการซ้อม (Map Pool)
        </label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_MAPS.map((map) => (
            <label
              key={map}
              className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs text-zinc-300 cursor-pointer hover:border-zinc-700"
            >
              <input
                type="checkbox"
                name="mapPool"
                value={map}
                defaultChecked={["Mirage", "Inferno", "Ancient"].includes(map)}
                className="accent-indigo-500"
              />
              {map}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1">
          หมายเหตุเพิ่มเติม (ถ้ามี)
        </label>
        <input
          name="notes"
          placeholder="เช่น ขอทีมแรงก์ FACEIT Lv.7+ หรือซ้อมแผนบุก Site A"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      {state.message && (
        <p
          className={`text-xs ${state.success ? "text-emerald-400" : "text-rose-400"}`}
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-6 py-2 rounded-lg text-sm transition"
      >
        {isPending ? "กำลังลงประกาศ..." : "เปิดห้องหาคู่ซ้อม"}
      </button>
    </form>
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

  // กรองเอาเฉพาะทีมที่ผู้ใช้นี้เป็น Captain และไม่ใช่ทีมเจ้าบ้านเอง
  const eligibleTeams = captainTeams.filter((t) => t.id !== hostTeamId);

  if (eligibleTeams.length === 0) {
    return null;
  }

  return (
    <form
      action={action}
      className="pt-3 border-t border-zinc-800/80 space-y-2"
    >
      <input type="hidden" name="scrimId" value={scrimId} />
      <div className="flex items-center gap-2">
        <select
          name="guestTeamId"
          required
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
        >
          {eligibleTeams.map((team) => (
            <option key={team.id} value={team.id}>
              รับคำท้าด้วย [{team.tag}] {team.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium px-3.5 py-1.5 rounded-lg transition whitespace-nowrap"
        >
          {isPending ? "..." : "รับคำท้า"}
        </button>
      </div>
      {state.message && !state.success && (
        <p className="text-xs text-rose-400">{state.message}</p>
      )}
    </form>
  );
}

export function CancelScrimButton({ scrimId }: { scrimId: string }) {
  return (
    <button
      type="button"
      onClick={() => cancelScrim(scrimId)}
      className="text-xs text-zinc-500 hover:text-rose-400 transition"
    >
      ยกเลิกห้อง
    </button>
  );
}
