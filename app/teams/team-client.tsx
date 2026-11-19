"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createTeam,
  deleteTeam,
  joinTeamByCode,
  regenerateInviteCode,
  removeMember,
  updateMemberRole,
  type ActionResponse,
} from "@/app/actions/team";

const initialState: ActionResponse = { success: false, message: "" };

export function TeamForms({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [createState, createAction, isCreating] = useActionState(
    createTeam,
    initialState,
  );
  const [joinState, joinAction, isJoining] = useActionState(
    joinTeamByCode,
    initialState,
  );

  if (!isLoggedIn) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">
            เข้าสู่ระบบเพื่อสร้างทีมหรือเข้าร่วมทีม
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            บัญชีของคุณจะถูกผูกกับรายชื่อผู้เล่น (Roster)
            และสิทธิ์หัวหน้าทีมโดยอัตโนมัติ
          </p>
        </div>
        <Link
          href="/login"
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition"
        >
          ไปหน้าเข้าสู่ระบบ →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
      {/* ฟอร์มสร้างทีม */}
      <form
        action={createAction}
        className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-white">
          สร้างทีมใหม่ (Create Team)
        </h2>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs text-zinc-400 mb-1">
              ชื่อทีม (Team Name)
            </label>
            <input
              name="name"
              placeholder="เช่น Team Liquid, Bacon Time"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Tag (สูงสุด 5 ตัว)
            </label>
            <input
              name="tag"
              maxLength={5}
              placeholder="เช่น TL"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white uppercase focus:outline-none focus:border-emerald-500"
              required
            />
          </div>
        </div>

        {createState.message && (
          <p
            className={`text-xs ${createState.success ? "text-emerald-400" : "text-rose-400"}`}
          >
            {createState.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isCreating}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition"
        >
          {isCreating ? "กำลังสร้างทีม..." : "สร้างทีม (คุณจะเป็น Captain)"}
        </button>
      </form>

      {/* ฟอร์มเข้าร่วมทีม */}
      <form
        action={joinAction}
        className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-white">
          เข้าร่วมทีมด้วย Invite Code
        </h2>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            Invite Code
          </label>
          <input
            name="inviteCode"
            placeholder="วางรหัสเชิญเข้าทีมที่นี่"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
            required
          />
        </div>

        {joinState.message && (
          <p
            className={`text-xs ${joinState.success ? "text-emerald-400" : "text-rose-400"}`}
          >
            {joinState.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isJoining}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition"
        >
          {isJoining ? "กำลังตรวจสอบ..." : "เข้าร่วมทีม"}
        </button>
      </form>
    </div>
  );
}

export function InviteCodeBox({
  teamId,
  inviteCode,
}: {
  teamId: string;
  inviteCode: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs">
      <span className="text-zinc-400">Invite Code:</span>
      <code className="text-amber-400 font-mono select-all">{inviteCode}</code>
      <button
        type="button"
        onClick={handleCopy}
        className="ml-auto text-zinc-300 hover:text-white bg-zinc-800 px-2 py-0.5 rounded"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <button
        type="button"
        onClick={() => regenerateInviteCode(teamId)}
        title="สร้างโค้ดเชิญใหม่"
        className="text-zinc-400 hover:text-amber-400 px-1"
      >
        ↻
      </button>
    </div>
  );
}

export function MemberControls({
  memberId,
  currentRole,
  isSelf,
}: {
  memberId: string;
  currentRole: string;
  isSelf: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={currentRole}
        onChange={(e) => updateMemberRole(memberId, e.target.value)}
        className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded px-2 py-1"
      >
        <option value="CAPTAIN">CAPTAIN</option>
        <option value="PLAYER">PLAYER</option>
        <option value="SUB">SUB</option>
      </select>
      {!isSelf && (
        <button
          type="button"
          onClick={() => removeMember(memberId)}
          className="text-xs text-rose-400 hover:text-rose-300 px-1.5 py-0.5 rounded hover:bg-rose-950/50"
        >
          ลบ
        </button>
      )}
    </div>
  );
}

export function DeleteTeamButton({ teamId }: { teamId: string }) {
  return (
    <button
      type="button"
      onClick={() => deleteTeam(teamId)}
      className="text-xs text-zinc-500 hover:text-rose-400 transition"
    >
      ลบทีม
    </button>
  );
}
