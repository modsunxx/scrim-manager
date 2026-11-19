"use client";

import { useActionState } from "react";
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
  const [state, action, isPending] = useActionState(
    createTournament,
    initialState,
  );

  if (!isOrganizer) return null;

  return (
    <form
      action={action}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5 mb-10"
    >
      <h2 className="text-lg font-semibold text-white">
        เปิดรับสมัครทัวร์นาเมนต์ใหม่ (Open Registration)
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs text-zinc-400 mb-1">
            ชื่อรายการแข่งขัน
          </label>
          <input
            name="name"
            placeholder="เช่น Bang Phra Campus Cup 2026"
            required
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            เกมที่ใช้แข่ง
          </label>
          <select
            name="game"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
          >
            <option value="CS2">Counter-Strike 2</option>
            <option value="VALORANT">Valorant</option>
            <option value="DOTA2">Dota 2</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            โควตาทีม / สมาชิกขั้นต่ำ
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select
              name="maxTeams"
              defaultValue="4"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value={4}>4 ทีม</option>
              <option value={8}>8 ทีม</option>
            </select>
            <select
              name="minPlayers"
              defaultValue="1"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value={1}>ขั้นต่ำ 1 คน</option>
              <option value={5}>ขั้นต่ำ 5 คน</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pt-1">
        {state.message ? (
          <p
            className={`text-xs ${state.success ? "text-emerald-400" : "text-rose-400"}`}
          >
            {state.message}
          </p>
        ) : (
          <span className="text-xs text-zinc-500">
            เมื่อสร้างแล้ว หัวหน้าทีมต่างๆ จะกดส่งทีมสมัครเข้ามาได้ทันที
          </span>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-medium px-6 py-2 rounded-lg text-sm transition"
        >
          {isPending ? "กำลังเปิดรับสมัคร..." : "เปิดรับสมัครทัวร์นาเมนต์"}
        </button>
      </div>
    </form>
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
    <div className="space-y-5">
      {/* แถบควบคุมสำหรับ Organizer */}
      {isOrganizer && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950 border border-amber-500/20 rounded-xl p-4">
          <div className="text-xs text-zinc-300">
            <span className="font-semibold text-amber-400">
              Organizer Controls:{" "}
            </span>
            รับสมัครทีมแล้ว {registeredTeams.length} / {maxTeams} ทีม
          </div>
          <div className="flex items-center gap-2">
            {!isFull && (
              <button
                type="button"
                onClick={() => fillDemoRegistrations(tournamentId)}
                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg transition"
              >
                + เติมทีมตัวอย่างให้เต็ม
              </button>
            )}
            <button
              type="button"
              disabled={!isFull}
              onClick={() => startTournamentBracket(tournamentId)}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold px-4 py-1.5 rounded-lg transition"
            >
              ปิดรับสมัคร & สุ่มสาย Bracket →
            </button>
          </div>
        </div>
      )}

      {/* ฟอร์มกดสมัครสำหรับ Captain */}
      {!isFull && unregisteredCaptainTeams.length > 0 && (
        <form
          action={action}
          className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2"
        >
          <input type="hidden" name="tournamentId" value={tournamentId} />
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-zinc-300">
              ส่งทีมของคุณลงแข่ง (ขั้นต่ำ {minPlayers} คน):
            </span>
            <select
              name="teamId"
              className="flex-1 min-w-50 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white"
            >
              {unregisteredCaptainTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.tag}] {t.name} ({t.memberCount} คน)
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition"
            >
              {isPending ? "กำลังสมัคร..." : "สมัครเข้าแข่งขัน"}
            </button>
          </div>
          {state.message && (
            <p
              className={`text-xs ${state.success ? "text-emerald-400" : "text-rose-400"}`}
            >
              {state.message}
            </p>
          )}
        </form>
      )}

      {/* รายชื่อทีมที่สมัครเข้ามาแล้ว */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
          รายชื่อทีมที่ลงทะเบียน ({registeredTeams.length} / {maxTeams})
        </h3>
        {registeredTeams.length === 0 ? (
          <p className="text-xs text-zinc-500 bg-zinc-950/60 border border-dashed border-zinc-800 rounded-lg p-6 text-center">
            ยังไม่มีทีมสมัครเข้าร่วมในขณะนี้
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {registeredTeams.map((team, idx) => {
              const isMyTeam = myRegisteredTeams.some((m) => m.id === team.id);
              return (
                <div
                  key={team.id}
                  className={`flex items-center justify-between bg-zinc-950 border rounded-lg px-3 py-2.5 text-xs ${
                    isMyTeam ? "border-emerald-500/40" : "border-zinc-800"
                  }`}
                >
                  <div className="truncate">
                    <span className="text-zinc-500 mr-1.5">#{idx + 1}</span>
                    <span className="text-amber-400 font-bold mr-1">
                      [{team.tag}]
                    </span>
                    <span className="text-zinc-200">{team.name}</span>
                  </div>
                  {isMyTeam && (
                    <button
                      type="button"
                      onClick={() =>
                        withdrawTeamFromTournament(tournamentId, team.id)
                      }
                      className="text-[11px] text-rose-400 hover:underline ml-2 shrink-0"
                    >
                      ถอนตัว
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
      className="mt-2 pt-2 border-t border-zinc-800/80 space-y-1.5"
    >
      <input type="hidden" name="matchId" value={matchId} />
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          name="scoreA"
          min={0}
          defaultValue={0}
          aria-label="Score Team A"
          className="w-12 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-center text-xs text-white"
          required
        />
        <span className="text-zinc-500 text-xs">:</span>
        <input
          type="number"
          name="scoreB"
          min={0}
          defaultValue={0}
          aria-label="Score Team B"
          className="w-12 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-center text-xs text-white"
          required
        />
        <button
          type="submit"
          disabled={isPending}
          className="ml-auto bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[11px] font-medium px-2.5 py-1 rounded transition"
        >
          {isPending ? "..." : "จบแมตช์"}
        </button>
      </div>
      {state.message && !state.success && (
        <p className="text-[11px] text-rose-400">{state.message}</p>
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
      onClick={() => deleteTournament(tournamentId)}
      className="text-xs text-zinc-500 hover:text-rose-400 transition"
    >
      ลบทัวร์นาเมนต์
    </button>
  );
}
