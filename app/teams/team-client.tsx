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
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
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
      <div className="border border-zinc-800 bg-zinc-900/40 p-5 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span
            className="font-mono text-[10px] font-semibold tracking-[0.18em] uppercase text-zinc-500 block mb-1"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Authentication Required
          </span>
          <p className="text-sm text-zinc-200 font-medium">
            เข้าสู่ระบบเพื่อสร้างทีมหรือเข้าร่วมทีม
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            บัญชีของคุณจะถูกผูกกับ Roster และสิทธิ์กัปตันทีมโดยอัตโนมัติ
          </p>
        </div>
        <Link
          href="/login"
          className="border border-cyan-500/40 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-400 font-mono text-xs font-semibold px-4 py-2 uppercase tracking-widest transition-colors"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          [ เข้าสู่ระบบ → ]
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-zinc-800 bg-zinc-900/30 p-5 mb-8">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("create")}
          className={`font-mono text-xs font-bold uppercase tracking-wider px-3 py-1.5 transition-colors border ${
            activeTab === "create"
              ? "border-cyan-500/60 bg-cyan-950/30 text-cyan-300"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          + สร้างทีมใหม่
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("join")}
          className={`font-mono text-xs font-bold uppercase tracking-wider px-3 py-1.5 transition-colors border ${
            activeTab === "join"
              ? "border-cyan-500/60 bg-cyan-950/30 text-cyan-300"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          # เข้าร่วมทีมด้วย Code
        </button>
      </div>

      {activeTab === "create" ? (
        /* ฟอร์มสร้างทีม */
        <form action={createAction} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label
                className="block font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-1"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                ชื่อทีม (Team Name)
              </label>
              <input
                name="name"
                placeholder="เช่น Paper Rex, Fnatic"
                className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500/60 transition-colors"
                required
              />
            </div>
            <div>
              <label
                className="block font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-1"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                Tag (สูงสุด 5 ตัว)
              </label>
              <input
                name="tag"
                maxLength={5}
                placeholder="PRX"
                className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-cyan-400 font-mono font-bold uppercase placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500/60 transition-colors"
                style={{ fontFamily: "var(--font-geist-mono)" }}
                required
              />
            </div>
          </div>

          {createState.message && (
            <p
              className={`font-mono text-xs ${
                createState.success ? "text-cyan-400" : "text-rose-400"
              }`}
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {createState.message}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            <span
              className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              * คุณจะได้รับสิทธิ์ Captain อัตโนมัติ
            </span>
            <button
              type="submit"
              disabled={isCreating}
              className="border border-cyan-500/60 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 font-mono text-xs font-bold uppercase tracking-widest px-5 py-2 transition-colors disabled:opacity-40"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {isCreating ? "กำลังสร้าง..." : "สร้างทีมใหม่ →"}
            </button>
          </div>
        </form>
      ) : (
        /* ฟอร์มเข้าร่วมทีม */
        <form action={joinAction} className="space-y-4">
          <div>
            <label
              className="block font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-1"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Invite Code จากหัวหน้าทีม
            </label>
            <input
              name="inviteCode"
              placeholder="วางรหัสเชิญ เช่น a8f9e2b1..."
              className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-cyan-300 font-mono placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500/60 transition-colors"
              style={{ fontFamily: "var(--font-geist-mono)" }}
              required
            />
          </div>

          {joinState.message && (
            <p
              className={`font-mono text-xs ${
                joinState.success ? "text-cyan-400" : "text-rose-400"
              }`}
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {joinState.message}
            </p>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isJoining}
              className="border border-cyan-500/60 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 font-mono text-xs font-bold uppercase tracking-widest px-5 py-2 transition-colors disabled:opacity-40"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {isJoining ? "กำลังตรวจสอบ..." : "ยืนยันเข้าร่วมทีม →"}
            </button>
          </div>
        </form>
      )}
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
    <div className="flex items-center gap-2 border border-zinc-800 bg-zinc-950 px-3 py-1.5">
      <span
        className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 select-none"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        CODE:
      </span>
      <code
        className="font-mono text-xs text-amber-300 font-semibold tracking-wider select-all truncate"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        {inviteCode}
      </code>
      <div className="ml-auto flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleCopy}
          className="border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 transition-colors"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {copied ? "COPIED" : "COPY"}
        </button>
        <button
          type="button"
          onClick={() => regenerateInviteCode(teamId)}
          title="สร้างโค้ดเชิญใหม่"
          className="border border-zinc-800 hover:border-amber-500/50 text-zinc-500 hover:text-amber-400 font-mono text-xs px-1.5 py-0.5 transition-colors"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          ↻
        </button>
      </div>
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
    <div className="flex items-center gap-1.5 shrink-0">
      <select
        value={currentRole}
        onChange={(e) => updateMemberRole(memberId, e.target.value)}
        className="bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-300 uppercase tracking-wider px-2 py-1 focus:outline-none focus:border-cyan-500/60"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        <option value="CAPTAIN">CAPTAIN</option>
        <option value="PLAYER">PLAYER</option>
        <option value="SUB">SUB</option>
      </select>
      {!isSelf && (
        <button
          type="button"
          onClick={() => removeMember(memberId)}
          className="font-mono text-[10px] text-zinc-600 hover:text-rose-400 hover:border-rose-500/30 border border-transparent px-1.5 py-0.5 uppercase tracking-wider transition-colors"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          KICK
        </button>
      )}
    </div>
  );
}

export function DeleteTeamButton({ teamId }: { teamId: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (confirm("ยืนยันการลบทีมนี้?")) {
          deleteTeam(teamId);
        }
      }}
      className="font-mono text-[10px] text-zinc-600 hover:text-rose-400 tracking-widest uppercase transition-colors"
      style={{ fontFamily: "var(--font-geist-mono)" }}
    >
      [ DISBAND TEAM ]
    </button>
  );
}
