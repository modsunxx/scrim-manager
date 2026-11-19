"use client";

import { useActionState, useState, useTransition } from "react";
import {
  performMapVeto,
  selectStartingSide,
  updateMatchLobbyInfo,
  type ActionResponse,
} from "@/app/actions/match";
import type { NextVetoTurn, VetoStepEntry } from "@/lib/veto";

const initialState: ActionResponse = { success: false, message: "" };

export function MapVetoBoard({
  matchId,
  bestOf,
  mapPool,
  bannedMaps,
  pickedMaps,
  vetoLog,
  nextTurn,
  teamATag,
  teamBTag,
  canActNow,
  isFinished,
}: {
  matchId: string;
  bestOf: number;
  mapPool: string[];
  bannedMaps: string[];
  pickedMaps: string[];
  vetoLog: VetoStepEntry[];
  nextTurn: NextVetoTurn;
  teamATag: string;
  teamBTag: string;
  canActNow: boolean;
  isFinished: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string>("");

  const getTeamTag = (side: "A" | "B") => (side === "A" ? teamATag : teamBTag);

  const handleMapAction = (mapName: string) => {
    setFeedback("");
    startTransition(async () => {
      const res = await performMapVeto(matchId, mapName);
      if (!res.success) setFeedback(res.message);
    });
  };

  const handleSideSelect = (side: string) => {
    setFeedback("");
    startTransition(async () => {
      const res = await selectStartingSide(matchId, side);
      if (!res.success) setFeedback(res.message);
    });
  };

  const selectedEntries = vetoLog.filter(
    (e) => e.type === "PICK" || e.type === "DECIDER",
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
      {/* Header & สถานะคิวปัจจุบัน */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded">
              BEST OF {bestOf}
            </span>
            <h2 className="text-lg font-semibold text-white">
              Map Veto & Side Selection
            </h2>
          </div>

          <p className="text-xs text-zinc-400 mt-1">
            {nextTurn.kind === "DONE"
              ? "เลือกแผนที่และฝั่งเริ่มเกมครบสมบูรณ์แล้ว"
              : nextTurn.kind === "SIDE"
                ? `คิวเลือกฝั่งเริ่มเกม: ทีม [${getTeamTag(nextTurn.team)}] เลือกฝั่งสำหรับ Map ${
                    nextTurn.mapNumber
                  } (${nextTurn.map})`
                : `คิวปัจจุบัน: ทีม [${getTeamTag(nextTurn.team)}] ต้องกด ${nextTurn.action} แผนที่`}
          </p>
        </div>
      </div>

      {/* กล่องกดเลือกฝั่งเริ่มเกม (แสดงเมื่อถึงขั้นตอน SIDE) */}
      {!isFinished && nextTurn.kind === "SIDE" && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-300">
              Map {nextTurn.mapNumber}: {nextTurn.map} — รอทีม [
              {getTeamTag(nextTurn.team)}] เลือกฝั่งเริ่มเกม
            </p>
            <p className="text-xs text-zinc-400">
              เลือกฝั่งที่ต้องการเล่นในครึ่งแรก (First Half)
            </p>
          </div>

          {canActNow ? (
            <div className="flex items-center gap-2">
              {nextTurn.options.map((side) => (
                <button
                  key={side}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSideSelect(side)}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 font-bold text-xs px-5 py-2 rounded-lg transition"
                >
                  Start {side}
                </button>
              ))}
            </div>
          ) : (
            <span className="text-xs text-amber-400/80 italic">
              กำลังรอหัวหน้าทีม [{getTeamTag(nextTurn.team)}] กดเลือกฝั่ง...
            </span>
          )}
        </div>
      )}

      {/* สรุปรายการแผนที่ที่ใช้แข่งจริง (Map 1 / Map 2 / Map 3) */}
      {selectedEntries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {selectedEntries.map((entry, idx) => (
            <div
              key={`${entry.map}-${idx}`}
              className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-emerald-400 uppercase">
                  Map {idx + 1} ({entry.type})
                </span>
                <span className="text-zinc-400">
                  {entry.byTeam === "SYSTEM"
                    ? "Decider"
                    : `Picked by [${getTeamTag(entry.byTeam)}]`}
                </span>
              </div>
              <div className="text-lg font-bold text-white">{entry.map}</div>
              <div className="text-xs text-zinc-300 pt-1 border-t border-emerald-500/20">
                {entry.chosenSide && entry.sideByTeam ? (
                  <span>
                    <strong className="text-amber-300">
                      [{getTeamTag(entry.sideByTeam)}]
                    </strong>{" "}
                    เริ่มฝั่ง{" "}
                    <strong className="text-white">{entry.chosenSide}</strong>
                  </span>
                ) : (
                  <span className="text-amber-400 italic">
                    รอเลือกฝั่งเริ่มเกม...
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ตาราง Map Pool 7 แผนที่ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {mapPool.map((map) => {
          const isBanned = bannedMaps.includes(map);
          const isPicked = pickedMaps.includes(map);
          const logEntry = vetoLog.find((e) => e.map === map);

          return (
            <div
              key={map}
              className={`rounded-xl border p-4 flex flex-col justify-between items-center text-center space-y-3 transition ${
                isPicked
                  ? "bg-emerald-500/15 border-emerald-500 text-emerald-200"
                  : isBanned
                    ? "bg-zinc-950/60 border-zinc-800/60 text-zinc-600"
                    : "bg-zinc-950 border-zinc-800 text-zinc-100"
              }`}
            >
              <span
                className={`font-bold text-sm ${isBanned ? "line-through" : ""}`}
              >
                {map}
              </span>

              {isPicked ? (
                <span className="text-[10px] font-bold uppercase bg-emerald-500 text-zinc-950 px-2 py-0.5 rounded">
                  {logEntry?.type === "DECIDER"
                    ? "DECIDER"
                    : `PICK [${logEntry?.byTeam !== "SYSTEM" && logEntry?.byTeam ? getTeamTag(logEntry.byTeam) : ""}]`}
                </span>
              ) : isBanned ? (
                <span className="text-[10px] text-rose-400/80">
                  Ban [
                  {logEntry?.byTeam && logEntry.byTeam !== "SYSTEM"
                    ? getTeamTag(logEntry.byTeam)
                    : ""}
                  ]
                </span>
              ) : !isFinished && nextTurn.kind === "MAP" && canActNow ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleMapAction(map)}
                  className={`w-full text-white text-xs font-medium py-1 rounded-lg transition disabled:opacity-40 ${
                    nextTurn.action === "PICK"
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "bg-rose-600/90 hover:bg-rose-500"
                  }`}
                >
                  {isPending ? "..." : nextTurn.action}
                </button>
              ) : (
                <span className="text-[10px] text-zinc-500">Available</span>
              )}
            </div>
          );
        })}
      </div>

      {feedback && <p className="text-xs text-rose-400">{feedback}</p>}
    </div>
  );
}

export function LobbyInfoBox({
  matchId,
  lobbyInfo,
  canEdit,
}: {
  matchId: string;
  lobbyInfo: string | null;
  canEdit: boolean;
}) {
  const [state, action, isPending] = useActionState(
    updateMatchLobbyInfo,
    initialState,
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-white">
        Server IP / รหัสห้องแข่งขัน (Match Lobby)
      </h2>

      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 text-sm font-mono text-amber-300">
        {lobbyInfo || "ยังไม่มีการระบุ Server IP หรือรหัสเข้าห้องเกม"}
      </div>

      {canEdit && (
        <form action={action} className="space-y-2 pt-1">
          <input type="hidden" name="matchId" value={matchId} />
          <div className="flex flex-wrap gap-2">
            <input
              name="lobbyInfo"
              defaultValue={lobbyInfo ?? ""}
              placeholder="เช่น connect 103.253.72.10:27015; password scrim2026 หรือ Lobby Code: ABC12"
              className="flex-1 min-w-65 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
            >
              {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูลห้อง"}
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
    </div>
  );
}
