export type VetoStepEntry = {
  type: "BAN" | "PICK" | "DECIDER";
  map: string;
  byTeam: "A" | "B" | "SYSTEM";
  sideByTeam?: "A" | "B";
  chosenSide?: string;
};

export type NextVetoTurn =
  | {
      kind: "MAP";
      action: "BAN" | "PICK";
      team: "A" | "B";
    }
  | {
      kind: "SIDE";
      map: string;
      mapNumber: number;
      team: "A" | "B";
      options: string[];
    }
  | {
      kind: "DONE";
    };

// ลำดับการแบน/เลือกแผนที่มาตรฐานแข่งขัน 7 แผนที่
const BO1_SEQUENCE: { action: "BAN" | "PICK"; team: "A" | "B" }[] = [
  { action: "BAN", team: "A" },
  { action: "BAN", team: "B" },
  { action: "BAN", team: "A" },
  { action: "BAN", team: "B" },
  { action: "BAN", team: "A" },
  { action: "BAN", team: "B" },
];

const BO3_SEQUENCE: { action: "BAN" | "PICK"; team: "A" | "B" }[] = [
  { action: "BAN", team: "A" },
  { action: "BAN", team: "B" },
  { action: "PICK", team: "A" }, // Map 1
  { action: "PICK", team: "B" }, // Map 2
  { action: "BAN", team: "A" },
  { action: "BAN", team: "B" },
];

export function getSideOptions(game: string): string[] {
  if (game === "VALORANT") return ["Attack", "Defense"];
  if (game === "CS2") return ["CT", "T"];
  return [];
}

export function getNextVetoTurn(
  bestOf: number,
  game: string,
  vetoLog: VetoStepEntry[],
): NextVetoTurn {
  const sideOptions = getSideOptions(game);

  // 1. ตรวจสอบก่อนว่ามีแผนที่ที่ถูก PICK หรือ DECIDER แล้ว แต่ยังไม่ได้เลือกฝั่งเริ่มเกมหรือไม่
  if (sideOptions.length > 0) {
    let pickCounter = 0;
    for (const entry of vetoLog) {
      if (entry.type === "PICK" || entry.type === "DECIDER") {
        pickCounter++;
        if (!entry.chosenSide) {
          // ทีมตรงข้ามกับคนเลือกแผนที่เป็นคนเลือกฝั่งเริ่มเกม (Decider ให้ทีม A เลือกฝั่ง)
          const sideChooser: "A" | "B" =
            entry.byTeam === "A" ? "B" : entry.byTeam === "B" ? "A" : "A";

          return {
            kind: "SIDE",
            map: entry.map,
            mapNumber: pickCounter,
            team: sideChooser,
            options: sideOptions,
          };
        }
      }
    }
  }

  // 2. ถ้าเลือกฝั่งครบแล้ว ให้ไปขั้นตอน BAN / PICK ถัดไปตามลำดับ
  const sequence = bestOf === 3 ? BO3_SEQUENCE : BO1_SEQUENCE;
  const userActionsCount = vetoLog.filter((e) => e.byTeam !== "SYSTEM").length;

  if (userActionsCount < sequence.length) {
    const nextStep = sequence[userActionsCount];
    return {
      kind: "MAP",
      action: nextStep.action,
      team: nextStep.team,
    };
  }

  return { kind: "DONE" };
}
