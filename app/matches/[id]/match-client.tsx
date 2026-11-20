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

/* ─── Design tokens ────────────────────────────────────────────────────────
   Broadcast palette — consistent across all states:
   • Cyan  #22d3ee  — active / your turn / pick
   • Rose  #f43f5e  — ban
   • Amber #f59e0b  — side selection
   • Zinc  neutral ground
─────────────────────────────────────────────────────────────────────────── */

type VetoSequenceStep = {
  stepIndex: number;
  action: "BAN" | "PICK";
  team: "A" | "B";
  entry?: VetoStepEntry;
  isActive: boolean;
  isCompleted: boolean;
};

/** Build the annotated sequence so we can render a step-tracker */
function buildAnnotatedSequence(
  bestOf: number,
  vetoLog: VetoStepEntry[],
): VetoSequenceStep[] {
  const BO1: { action: "BAN" | "PICK"; team: "A" | "B" }[] = [
    { action: "BAN", team: "A" },
    { action: "BAN", team: "B" },
    { action: "BAN", team: "A" },
    { action: "BAN", team: "B" },
    { action: "BAN", team: "A" },
    { action: "BAN", team: "B" },
  ];
  const BO3: { action: "BAN" | "PICK"; team: "A" | "B" }[] = [
    { action: "BAN", team: "A" },
    { action: "BAN", team: "B" },
    { action: "PICK", team: "A" },
    { action: "PICK", team: "B" },
    { action: "BAN", team: "A" },
    { action: "BAN", team: "B" },
  ];
  const sequence = bestOf === 3 ? BO3 : BO1;
  const userActions = vetoLog.filter((e) => e.byTeam !== "SYSTEM");
  const completedCount = userActions.length;

  return sequence.map((step, i) => ({
    stepIndex: i,
    action: step.action,
    team: step.team,
    entry: i < completedCount ? userActions[i] : undefined,
    isActive: i === completedCount,
    isCompleted: i < completedCount,
  }));
}

/* ─────────────────────────────────────────────────────────────────────────
   MapVetoBoard — the main broadcast veto component
───────────────────────────────────────────────────────────────────────── */

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

  const sequence = buildAnnotatedSequence(bestOf, vetoLog);

  /* Determine active-turn context */
  const isSidePhase = !isFinished && nextTurn.kind === "SIDE";
  const isMapPhase = !isFinished && nextTurn.kind === "MAP";
  const isDone = nextTurn.kind === "DONE" || isFinished;

  return (
    <section aria-label="Map Veto Board">
      {/* ── SECTION LABEL ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-3">
        <span
          className="font-mono text-[10px] font-semibold tracking-[0.18em] uppercase text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          Map Veto · BO{bestOf}
        </span>
        <div className="flex-1 h-px bg-zinc-800" />
        {!isDone && (
          <span
            className="font-mono text-[10px] text-zinc-600 tracking-widest uppercase"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {sequence.filter((s) => s.isCompleted).length}/{sequence.length}{" "}
            steps
          </span>
        )}
      </div>

      {/* ── ACTIVE TURN BANNER ──────────────────────────────────── */}
      {!isDone && (
        <ActiveTurnBanner
          nextTurn={nextTurn}
          getTeamTag={getTeamTag}
          canActNow={canActNow}
          teamATag={teamATag}
          teamBTag={teamBTag}
        />
      )}

      {isDone && (
        <div className="border border-zinc-800 bg-zinc-900 px-5 py-3 mb-5 flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-cyan-400 shrink-0" />
          <span
            className="font-mono text-xs font-semibold text-cyan-400 tracking-widest uppercase"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Veto Complete — Match Ready
          </span>
        </div>
      )}

      {/* ── VETO SEQUENCE TRACKER ───────────────────────────────── */}
      <VetoSequenceTracker
        sequence={sequence}
        getTeamTag={getTeamTag}
      />

      {/* ── SIDE SELECTION PANEL (full interrupt) ───────────────── */}
      {isSidePhase && nextTurn.kind === "SIDE" && (
        <SideSelectionPanel
          nextTurn={nextTurn}
          getTeamTag={getTeamTag}
          canActNow={canActNow}
          isPending={isPending}
          onSelectSide={handleSideSelect}
        />
      )}

      {/* ── MAP POOL GRID ───────────────────────────────────────── */}
      <MapPoolGrid
        mapPool={mapPool}
        bannedMaps={bannedMaps}
        pickedMaps={pickedMaps}
        vetoLog={vetoLog}
        nextTurn={nextTurn}
        isFinished={isFinished}
        canActNow={canActNow}
        isPending={isPending}
        getTeamTag={getTeamTag}
        onMapAction={handleMapAction}
        isSidePhase={isSidePhase}
      />

      {/* ── CONFIRMED MAPS ──────────────────────────────────────── */}
      {selectedEntries.length > 0 && (
        <ConfirmedMapsRow
          selectedEntries={selectedEntries}
          getTeamTag={getTeamTag}
        />
      )}

      {/* ── ERROR FEEDBACK ──────────────────────────────────────── */}
      {feedback && (
        <p
          className="mt-3 font-mono text-xs text-rose-400 border border-rose-500/20 bg-rose-500/5 px-3 py-2"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          ⚠ {feedback}
        </p>
      )}
    </section>
  );
}

/* ─── ActiveTurnBanner ─────────────────────────────────────────────────── */

function ActiveTurnBanner({
  nextTurn,
  getTeamTag,
  canActNow,
  teamATag,
  teamBTag,
}: {
  nextTurn: NextVetoTurn;
  getTeamTag: (side: "A" | "B") => string;
  canActNow: boolean;
  teamATag: string;
  teamBTag: string;
}) {
  if (nextTurn.kind === "DONE") return null;

  const isBan = nextTurn.kind === "MAP" && nextTurn.action === "BAN";
  const isPick = nextTurn.kind === "MAP" && nextTurn.action === "PICK";
  const isSide = nextTurn.kind === "SIDE";

  const accentBg = isBan
    ? "bg-rose-950/60 border-rose-500/30"
    : isPick
      ? "bg-cyan-950/60 border-cyan-500/30"
      : "bg-amber-950/60 border-amber-500/30";

  const accentText = isBan
    ? "text-rose-400"
    : isPick
      ? "text-cyan-400"
      : "text-amber-400";

  const actionLabel = isBan ? "BAN" : isPick ? "PICK" : "SIDE SELECT";

  // nextTurn.kind is narrowed to "MAP" | "SIDE" here because of the early return above
  const teamTag = getTeamTag((nextTurn as { team: "A" | "B" }).team);

  return (
    <div
      className={`border ${accentBg} px-5 py-4 mb-4 flex flex-wrap items-center justify-between gap-4`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-4">
        {/* Pulsing team indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-70 ${
                isBan
                  ? "bg-rose-400"
                  : isPick
                    ? "bg-cyan-400"
                    : "bg-amber-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isBan
                  ? "bg-rose-400"
                  : isPick
                    ? "bg-cyan-400"
                    : "bg-amber-400"
              }`}
            />
          </span>
          <span
            className={`font-mono text-[10px] font-bold tracking-[0.2em] uppercase ${accentText}`}
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {actionLabel}
          </span>
        </div>

        {/* Team name — the loudest element */}
        <div>
          <span
            className={`font-mono font-bold text-xl leading-none ${accentText}`}
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            [{teamTag}]
          </span>
          {isSide && nextTurn.kind === "SIDE" && (
            <span className="ml-2 text-sm text-zinc-400 font-medium">
              — Map {nextTurn.mapNumber}: {nextTurn.map}
            </span>
          )}
        </div>
      </div>

      {/* Waiting label */}
      {!canActNow && (
        <span
          className={`font-mono text-xs tracking-widest uppercase ${accentText} opacity-60`}
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          Waiting…
        </span>
      )}
      {canActNow && (
        <span
          className={`font-mono text-xs font-bold tracking-widest uppercase ${accentText}`}
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          Your Turn →
        </span>
      )}
    </div>
  );
}

/* ─── VetoSequenceTracker ──────────────────────────────────────────────── */

function VetoSequenceTracker({
  sequence,
  getTeamTag,
}: {
  sequence: VetoSequenceStep[];
  getTeamTag: (side: "A" | "B") => string;
}) {
  return (
    <div className="mb-5 overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {sequence.map((step, i) => {
          const isBan = step.action === "BAN";
          const tag = getTeamTag(step.team);

          let bgClass = "bg-zinc-900 border-zinc-800 text-zinc-600";
          let labelClass = "text-zinc-700";
          let mapText = "·";

          if (step.isCompleted && step.entry) {
            bgClass = isBan
              ? "bg-rose-950/50 border-rose-800/50 text-rose-300"
              : "bg-cyan-950/50 border-cyan-800/50 text-cyan-300";
            labelClass = isBan ? "text-rose-500" : "text-cyan-500";
            mapText = step.entry.map;
          } else if (step.isActive) {
            bgClass = isBan
              ? "bg-rose-950/60 border-rose-500/50 text-rose-200"
              : "bg-cyan-950/60 border-cyan-500/50 text-cyan-200";
            labelClass = isBan ? "text-rose-400" : "text-cyan-400";
            mapText = "?";
          }

          return (
            <div
              key={i}
              className={`border px-3 py-2 min-w-[72px] flex flex-col items-center gap-1 transition-colors ${bgClass} ${step.isActive ? "ring-1 ring-inset " + (isBan ? "ring-rose-500/40" : "ring-cyan-500/40") : ""}`}
            >
              <span
                className={`font-mono text-[9px] font-bold tracking-[0.15em] uppercase ${labelClass}`}
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {step.action}
              </span>
              <span
                className="font-mono text-[9px] text-zinc-500 tracking-widest"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                [{tag}]
              </span>
              <span
                className={`font-mono text-xs font-semibold truncate max-w-[64px] text-center ${step.isActive ? (isBan ? "text-rose-300" : "text-cyan-300") : step.isCompleted ? "text-zinc-200" : "text-zinc-700"}`}
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {mapText}
              </span>
            </div>
          );
        })}
        {/* Decider slot for BO3 */}
        {sequence.some((s) => s.action === "PICK") && (
          <div className="border border-dashed border-zinc-800 px-3 py-2 min-w-[72px] flex flex-col items-center gap-1">
            <span
              className="font-mono text-[9px] font-bold tracking-[0.15em] uppercase text-zinc-700"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              DECIDER
            </span>
            <span
              className="font-mono text-[9px] text-zinc-700"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              [SYS]
            </span>
            <span
              className="font-mono text-xs text-zinc-700"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              auto
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── SideSelectionPanel ───────────────────────────────────────────────── */

function SideSelectionPanel({
  nextTurn,
  getTeamTag,
  canActNow,
  isPending,
  onSelectSide,
}: {
  nextTurn: NextVetoTurn & { kind: "SIDE" };
  getTeamTag: (side: "A" | "B") => string;
  canActNow: boolean;
  isPending: boolean;
  onSelectSide: (side: string) => void;
}) {
  return (
    <div className="border border-amber-500/30 bg-amber-950/30 mb-5">
      {/* Panel header */}
      <div className="border-b border-amber-500/20 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-70" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </span>
          <span
            className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-amber-400"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Side Selection
          </span>
        </div>
        <span
          className="font-mono text-[10px] text-amber-500/70 tracking-widest"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          Map {nextTurn.mapNumber} · {nextTurn.map}
        </span>
      </div>

      <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="text-base font-bold text-amber-300">
            [{getTeamTag(nextTurn.team)}]
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            เลือกฝั่งเริ่มเกม (First Half) สำหรับ{" "}
            <strong className="text-zinc-300">{nextTurn.map}</strong>
          </p>
        </div>

        {canActNow ? (
          <div className="flex items-center gap-2">
            {nextTurn.options.map((side) => (
              <button
                key={side}
                type="button"
                disabled={isPending}
                onClick={() => onSelectSide(side)}
                className="border border-amber-500/50 hover:border-amber-400 hover:bg-amber-500/10 disabled:opacity-40 text-amber-300 hover:text-amber-200 font-mono font-bold text-sm px-6 py-2.5 tracking-widest uppercase transition-colors"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {isPending ? "…" : side}
              </button>
            ))}
          </div>
        ) : (
          <span
            className="font-mono text-xs text-amber-500/60 tracking-widest uppercase"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Waiting for [{getTeamTag(nextTurn.team)}]…
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── MapPoolGrid ──────────────────────────────────────────────────────── */

function MapPoolGrid({
  mapPool,
  bannedMaps,
  pickedMaps,
  vetoLog,
  nextTurn,
  isFinished,
  canActNow,
  isPending,
  getTeamTag,
  onMapAction,
  isSidePhase,
}: {
  mapPool: string[];
  bannedMaps: string[];
  pickedMaps: string[];
  vetoLog: VetoStepEntry[];
  nextTurn: NextVetoTurn;
  isFinished: boolean;
  canActNow: boolean;
  isPending: boolean;
  getTeamTag: (side: "A" | "B") => string;
  onMapAction: (map: string) => void;
  isSidePhase: boolean;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 mb-5">
      {mapPool.map((map) => {
        const isBanned = bannedMaps.includes(map);
        const isPicked = pickedMaps.includes(map);
        const logEntry = vetoLog.find((e) => e.map === map);
        const isActive =
          !isFinished &&
          !isBanned &&
          !isPicked &&
          nextTurn.kind === "MAP" &&
          canActNow &&
          !isSidePhase;
        const isBanAction =
          nextTurn.kind === "MAP" && nextTurn.action === "BAN";

        let containerClass =
          "border flex flex-col items-center justify-between gap-2 px-2 py-3 text-center transition-colors min-h-[88px]";

        if (isPicked) {
          containerClass +=
            " border-cyan-500/50 bg-cyan-950/40 text-cyan-100";
        } else if (isBanned) {
          containerClass +=
            " border-zinc-800/40 bg-zinc-950/80 text-zinc-700 opacity-60";
        } else if (isActive) {
          containerClass += isBanAction
            ? " border-rose-500/40 bg-zinc-950 text-zinc-100 hover:border-rose-400 hover:bg-rose-950/30"
            : " border-cyan-500/40 bg-zinc-950 text-zinc-100 hover:border-cyan-400 hover:bg-cyan-950/30";
        } else {
          containerClass += " border-zinc-800 bg-zinc-900/50 text-zinc-500";
        }

        return (
          <div key={map} className={containerClass}>
            {/* Map name */}
            <span
              className={`font-mono text-xs font-bold tracking-wide ${
                isBanned ? "line-through text-zinc-700" : ""
              }`}
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {map}
            </span>

            {/* State badge / action button */}
            {isPicked ? (
              <div className="flex flex-col items-center gap-0.5">
                <span
                  className="font-mono text-[9px] font-bold tracking-[0.15em] uppercase text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-1.5 py-0.5"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  {logEntry?.type === "DECIDER"
                    ? "DECIDER"
                    : `PICK`}
                </span>
                {logEntry?.byTeam && logEntry.byTeam !== "SYSTEM" && (
                  <span
                    className="font-mono text-[9px] text-zinc-500"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    [{getTeamTag(logEntry.byTeam)}]
                  </span>
                )}
              </div>
            ) : isBanned ? (
              <div className="flex flex-col items-center gap-0.5">
                <span
                  className="font-mono text-[9px] tracking-[0.12em] uppercase text-rose-700"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  BANNED
                </span>
                {logEntry?.byTeam && logEntry.byTeam !== "SYSTEM" && (
                  <span
                    className="font-mono text-[9px] text-zinc-700"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    [{getTeamTag(logEntry.byTeam)}]
                  </span>
                )}
              </div>
            ) : isActive ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => onMapAction(map)}
                className={`w-full font-mono font-bold text-[10px] tracking-[0.15em] uppercase py-1.5 border transition-colors disabled:opacity-40 ${
                  isBanAction
                    ? "border-rose-500/60 text-rose-300 hover:bg-rose-500/10"
                    : "border-cyan-500/60 text-cyan-300 hover:bg-cyan-500/10"
                }`}
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {isPending ? "…" : isBanAction ? "BAN" : "PICK"}
              </button>
            ) : (
              <span
                className="font-mono text-[9px] text-zinc-700 tracking-widest"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                AVAIL
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── ConfirmedMapsRow ─────────────────────────────────────────────────── */

function ConfirmedMapsRow({
  selectedEntries,
  getTeamTag,
}: {
  selectedEntries: VetoStepEntry[];
  getTeamTag: (side: "A" | "B") => string;
}) {
  return (
    <div className="border-t border-zinc-800 pt-4 mb-1">
      <span
        className="font-mono text-[10px] font-semibold tracking-[0.18em] uppercase text-zinc-500 block mb-3"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        Confirmed Maps
      </span>
      <div className="flex flex-wrap gap-2">
        {selectedEntries.map((entry, idx) => (
          <div
            key={`${entry.map}-${idx}`}
            className="border border-cyan-500/30 bg-cyan-950/20 px-4 py-2.5 flex items-center gap-4 min-w-[160px]"
          >
            {/* Map number */}
            <span
              className="font-mono text-[10px] font-bold text-cyan-500 tracking-widest shrink-0"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              MAP {idx + 1}
            </span>

            {/* Map name */}
            <span className="font-bold text-sm text-white">{entry.map}</span>

            {/* Side info */}
            <div className="ml-auto text-right shrink-0">
              {entry.chosenSide && entry.sideByTeam ? (
                <>
                  <span
                    className="font-mono text-[9px] text-zinc-500 block"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    [{getTeamTag(entry.sideByTeam)}]
                  </span>
                  <span
                    className="font-mono text-[10px] font-bold text-amber-400 tracking-widest uppercase"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    {entry.chosenSide}
                  </span>
                </>
              ) : (
                <span
                  className="font-mono text-[10px] text-amber-500/60 tracking-widest uppercase"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  Side TBD
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── LobbyInfoBox ─────────────────────────────────────────────────────── */

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
    <section aria-label="Match Lobby">
      <div className="flex items-center gap-3 mb-3">
        <span
          className="font-mono text-[10px] font-semibold tracking-[0.18em] uppercase text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          Server / Lobby Info
        </span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      <div
        className="border border-zinc-800 bg-zinc-900/50 px-4 py-3 font-mono text-sm text-amber-300 mb-3"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        {lobbyInfo || (
          <span className="text-zinc-600">
            — ยังไม่มีข้อมูล Server IP หรือรหัสห้อง
          </span>
        )}
      </div>

      {canEdit && (
        <form action={action} className="flex flex-wrap gap-2">
          <input type="hidden" name="matchId" value={matchId} />
          <input
            name="lobbyInfo"
            defaultValue={lobbyInfo ?? ""}
            placeholder="เช่น connect 103.253.72.10:27015; password scrim2026"
            className="flex-1 min-w-60 bg-zinc-950 border border-zinc-800 focus:border-cyan-500/60 px-3 py-2 font-mono text-xs text-white placeholder:text-zinc-700 focus:outline-none transition-colors"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          />
          <button
            type="submit"
            disabled={isPending}
            className="border border-zinc-700 hover:border-cyan-500/50 hover:text-cyan-300 text-zinc-300 font-mono text-xs font-semibold tracking-widest uppercase px-4 py-2 transition-colors disabled:opacity-40"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {isPending ? "…" : "Save"}
          </button>
          {state.message && (
            <p
              className={`w-full font-mono text-xs mt-1 ${state.success ? "text-cyan-400" : "text-rose-400"}`}
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {state.message}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
