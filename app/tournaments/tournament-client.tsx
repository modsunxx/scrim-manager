"use client";

import { useActionState, useState } from "react";
import {
  createTournament,
  deleteTournament,
  fillDemoRegistrations,
  registerTeamToTournament,
  startTournamentBracket,
  submitMatchScore,
  withdrawTeamFromTournament,
  type ActionResponse,
} from "@/app/actions/tournament";

type TeamOption = {
  id: string;
  name: string;
  tag: string;
  memberCount: number;
};

const initialState: ActionResponse = { success: false, message: "" };

export function CreateTournamentForm({
  isOrganizer,
}: {
  isOrganizer: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, action, isPending] = useActionState(
    createTournament,
    initialState,
  );

  if (!isOrganizer) return null;

  return (
    <div className="border border-zinc-800 bg-zinc-900/30 p-5 mb-8">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <div>
          <span
            className="font-mono text-[10px] font-semibold tracking-[0.18em] uppercase text-amber-400 block"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Organizer Panel
          </span>
          <h2 className="text-base font-bold text-white mt-0.5">
            เปิดรับสมัครทัวร์นาเมนต์ใหม่ (Create Tournament)
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="border border-zinc-800 hover:border-amber-500/50 text-zinc-400 hover:text-amber-300 font-mono text-xs uppercase tracking-widest px-3 py-1.5 transition-colors"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {isOpen ? "[ ซ่อนฟอร์ม ▲ ]" : "[ + เปิดฟอร์มสร้างทัวร์นาเมนต์ ▼ ]"}
        </button>
      </div>

      {isOpen && (
        <form action={action} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label
                className="block font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-1"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                ชื่อรายการแข่งขัน (Tournament Name)
              </label>
              <input
                name="name"
                placeholder="เช่น VCT Challengers Thailand 2026"
                required
                className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <div>
              <label
                className="block font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-1"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                เกมที่ใช้แข่ง
              </label>
              <select
                name="game"
                className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500/60"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                <option value="CS2">Counter-Strike 2</option>
                <option value="VALORANT">Valorant</option>
                <option value="DOTA2">Dota 2</option>
              </select>
            </div>

            <div>
              <label
                className="block font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-1"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                โควตาทีม / สมาชิกขั้นต่ำ
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  name="maxTeams"
                  defaultValue="4"
                  className="w-full bg-zinc-950 border border-zinc-800 px-2 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500/60"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  <option value={4}>4 ทีม</option>
                  <option value={8}>8 ทีม</option>
                </select>
                <select
                  name="minPlayers"
                  defaultValue="1"
                  className="w-full bg-zinc-950 border border-zinc-800 px-2 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500/60"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  <option value={1}>ขั้นต่ำ 1 คน</option>
                  <option value={5}>ขั้นต่ำ 5 คน</option>
                </select>
              </div>
            </div>
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
              className="border border-amber-500/60 bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 font-mono text-xs font-bold uppercase tracking-widest px-5 py-2 transition-colors disabled:opacity-40"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {isPending ? "กำลังเปิดรับสมัคร..." : "ยืนยันสร้างรายการแข่งขัน →"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function TournamentRegistrationBox({
  tournamentId,
  maxTeams,
  minPlayers,
  registeredTeams,
  captainTeams,
  isOrganizer,
}: {
  tournamentId: string;
  maxTeams: number;
  minPlayers: number;
  registeredTeams: {
    id: string;
    name: string;
    tag: string;
    memberCount: number;
  }[];
  captainTeams: TeamOption[];
  isOrganizer: boolean;
}) {
  const [state, action, isPending] = useActionState(
    registerTeamToTournament,
    initialState,
  );

  const registeredIds = new Set(registeredTeams.map((t) => t.id));
  const unregisteredCaptainTeams = captainTeams.filter(
    (t) => !registeredIds.has(t.id),
  );
  const myRegisteredTeams = captainTeams.filter((t) => registeredIds.has(t.id));
  const isFull = registeredTeams.length >= maxTeams;

  return (
    <div className="space-y-4">
      {/* แถบควบคุมสำหรับ Organizer */}
      {isOrganizer && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-amber-500/30 bg-amber-950/20 px-4 py-3">
          <div className="font-mono text-xs text-zinc-300" style={{ fontFamily: "var(--font-geist-mono)" }}>
            <span className="font-bold text-amber-400 tracking-wider uppercase mr-2">
              [ORGANIZER]
            </span>
            ลงทะเบียนแล้ว: {registeredTeams.length} / {maxTeams} ทีม
          </div>
          <div className="flex items-center gap-2">
            {!isFull && (
              <button
                type="button"
                onClick={() => fillDemoRegistrations(tournamentId)}
                className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-mono text-[11px] uppercase tracking-wider px-3 py-1 transition-colors"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                + เติมทีมตัวอย่าง
              </button>
            )}
            <button
              type="button"
              disabled={!isFull}
              onClick={() => startTournamentBracket(tournamentId)}
              className="border border-cyan-500/60 bg-cyan-950/30 hover:bg-cyan-900/40 disabled:opacity-30 text-cyan-300 font-mono text-[11px] font-bold uppercase tracking-wider px-4 py-1 transition-colors"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              ปิดรับสมัคร &amp; รันสาย Bracket →
            </button>
          </div>
        </div>
      )}

      {/* ฟอร์มกดสมัครสำหรับ Captain */}
      {!isFull && unregisteredCaptainTeams.length > 0 && (
        <form
          action={action}
          className="border border-zinc-800 bg-zinc-950 px-4 py-3 flex flex-wrap items-center gap-3"
        >
          <input type="hidden" name="tournamentId" value={tournamentId} />
          <span
            className="font-mono text-xs text-zinc-400"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            ส่งทีมลงแข่ง (ขั้นต่ำ {minPlayers} คน):
          </span>
          <select
            name="teamId"
            className="flex-1 min-w-[200px] bg-zinc-900 border border-zinc-800 px-3 py-1.5 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500/60"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {unregisteredCaptainTeams.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.tag}] {t.name} ({t.memberCount} สมาชิก)
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="border border-cyan-500/60 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 font-mono text-xs font-bold uppercase tracking-widest px-4 py-1.5 transition-colors disabled:opacity-40"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {isPending ? "กำลังสมัคร..." : "สมัครเข้าร่วม"}
          </button>
          {state.message && (
            <p
              className={`w-full font-mono text-xs mt-1 ${
                state.success ? "text-cyan-400" : "text-rose-400"
              }`}
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {state.message}
            </p>
          )}
        </form>
      )}

      {/* รายชื่อทีมที่สมัครเข้ามาแล้ว */}
      <div>
        <span
          className="font-mono text-[9px] font-semibold tracking-[0.18em] uppercase text-zinc-500 block mb-2"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          Registered Teams ({registeredTeams.length} / {maxTeams})
        </span>

        {registeredTeams.length === 0 ? (
          <div className="border border-dashed border-zinc-800 p-6 text-center">
            <span
              className="font-mono text-xs text-zinc-600 uppercase tracking-widest"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Waiting for team registrations
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {registeredTeams.map((team, idx) => {
              const isMyTeam = myRegisteredTeams.some((m) => m.id === team.id);
              return (
                <div
                  key={team.id}
                  className={`flex items-center justify-between border px-3 py-2 text-xs ${
                    isMyTeam
                      ? "border-cyan-500/40 bg-cyan-950/20"
                      : "border-zinc-800 bg-zinc-950"
                  }`}
                >
                  <div className="truncate">
                    <span
                      className="font-mono text-zinc-600 mr-1.5"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      #{idx + 1}
                    </span>
                    <span
                      className="font-mono text-cyan-400 font-bold mr-1"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      [{team.tag}]
                    </span>
                    <span className="text-zinc-200 truncate">{team.name}</span>
                  </div>
                  {isMyTeam && (
                    <button
                      type="button"
                      onClick={() =>
                        withdrawTeamFromTournament(tournamentId, team.id)
                      }
                      className="font-mono text-[10px] text-zinc-600 hover:text-rose-400 uppercase tracking-wider ml-2 shrink-0 transition-colors"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      [ถอนตัว]
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function MatchScoreForm({ matchId }: { matchId: string }) {
  const [state, action, isPending] = useActionState(
    submitMatchScore,
    initialState,
  );

  return (
    <form
      action={action}
      className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2"
    >
      <input type="hidden" name="matchId" value={matchId} />
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          name="scoreA"
          min={0}
          defaultValue={0}
          aria-label="Score Team A"
          className="w-10 bg-zinc-900 border border-zinc-800 px-1 py-0.5 text-center font-mono text-xs text-white focus:outline-none focus:border-cyan-500"
          style={{ fontFamily: "var(--font-geist-mono)" }}
          required
        />
        <span
          className="font-mono text-zinc-600 text-xs"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          :
        </span>
        <input
          type="number"
          name="scoreB"
          min={0}
          defaultValue={0}
          aria-label="Score Team B"
          className="w-10 bg-zinc-900 border border-zinc-800 px-1 py-0.5 text-center font-mono text-xs text-white focus:outline-none focus:border-cyan-500"
          style={{ fontFamily: "var(--font-geist-mono)" }}
          required
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="border border-zinc-800 hover:border-cyan-500/50 text-zinc-400 hover:text-cyan-300 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 transition-colors disabled:opacity-40"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        {isPending ? "…" : "บันทึกผล"}
      </button>
      {state.message && !state.success && (
        <span
          className="font-mono text-[10px] text-rose-400"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {state.message}
        </span>
      )}
    </form>
  );
}

export function DeleteTournamentButton({
  tournamentId,
}: {
  tournamentId: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (confirm("ยืนยันการลบทัวร์นาเมนต์นี้?")) {
          deleteTournament(tournamentId);
        }
      }}
      className="font-mono text-[10px] text-zinc-600 hover:text-rose-400 tracking-widest uppercase transition-colors"
      style={{ fontFamily: "var(--font-geist-mono)" }}
    >
      [ DELETE TOURNAMENT ]
    </button>
  );
}
