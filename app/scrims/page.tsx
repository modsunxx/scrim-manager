import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  AcceptScrimForm,
  CancelScrimButton,
  CreateScrimForm,
} from "./scrim-client";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function ScrimsPage() {
  const [currentUser, scrims] = await Promise.all([
    getCurrentUser(),
    prisma.scrim.findMany({
      where: { status: { not: "CANCELLED" } },
      include: {
        hostTeam: { select: { id: true, name: true, tag: true } },
        guestTeam: { select: { id: true, name: true, tag: true } },
      },
      orderBy: { startTime: "asc" },
    }),
  ]);

  // กรองเอาเฉพาะทีมที่ผู้ใช้ปัจจุบันมีตำแหน่งเป็น CAPTAIN
  const captainTeams =
    currentUser?.memberships
      .filter((m) => m.role === "CAPTAIN")
      .map((m) => ({
        id: m.team.id,
        name: m.team.name,
        tag: m.team.tag,
      })) ?? [];

  const captainTeamIds = new Set(captainTeams.map((t) => t.id));

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-xs text-zinc-400 hover:text-white transition"
          >
            ← กลับหน้าหลัก
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
            Scrim Finder & Matchmaking
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            ลงประกาศหาคู่ซ้อม
            หรือกดรับคำท้าจากทีมอื่นพร้อมระบบป้องกันตารางเวลาชนกัน
          </p>
        </div>

        {/* ฟอร์มลงประกาศหาคู่ซ้อม (แสดงตามสิทธิ์ Captain) */}
        <CreateScrimForm
          captainTeams={captainTeams}
          isLoggedIn={Boolean(currentUser)}
        />

        {/* รายการห้องซ้อม */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            ตารางซ้อมทั้งหมด ({scrims.length})
          </h2>

          {scrims.length === 0 ? (
            <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-sm">
              ยังไม่มีประกาศหาคู่ซ้อมในขณะนี้
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scrims.map((scrim) => {
                const isHostCaptain = captainTeamIds.has(scrim.hostTeamId);

                return (
                  <div
                    key={scrim.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            scrim.status === "OPEN"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {scrim.status === "OPEN"
                            ? "เปิดรับคู่ซ้อม"
                            : "ยืนยันคู่ซ้อมแล้ว"}
                        </span>

                        {isHostCaptain && (
                          <CancelScrimButton scrimId={scrim.id} />
                        )}
                      </div>

                      {/* ชื่อทีม */}
                      <div>
                        <div className="flex items-center gap-2 text-base font-bold text-white">
                          <span className="text-indigo-400">
                            [{scrim.hostTeam.tag}]
                          </span>
                          <span>{scrim.hostTeam.name}</span>
                          {scrim.guestTeam ? (
                            <>
                              <span className="text-zinc-500 text-xs font-normal">
                                VS
                              </span>
                              <span className="text-emerald-400">
                                [{scrim.guestTeam.tag}]
                              </span>
                              <span>{scrim.guestTeam.name}</span>
                            </>
                          ) : (
                            <span className="text-zinc-500 text-xs font-normal italic">
                              (รอผู้ท้าชิง)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">
                          เริ่ม: {formatDateTime(scrim.startTime)} — จบ:{" "}
                          {formatDateTime(scrim.endTime)}
                        </p>
                      </div>

                      {/* Map Pool */}
                      <div className="flex flex-wrap gap-1.5">
                        {scrim.mapPool.map((map) => (
                          <span
                            key={map}
                            className="text-[11px] bg-zinc-950 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded"
                          >
                            {map}
                          </span>
                        ))}
                      </div>

                      {scrim.notes && (
                        <p className="text-xs text-zinc-400 bg-zinc-950/70 border border-zinc-800/70 rounded-lg px-3 py-2">
                          {scrim.notes}
                        </p>
                      )}
                    </div>

                    {/* ปุ่มรับคำท้า แสดงเฉพาะเมื่อห้องเปิดอยู่ และผู้ใช้เป็น Captain ของทีมอื่น */}
                    {scrim.status === "OPEN" && (
                      <AcceptScrimForm
                        scrimId={scrim.id}
                        hostTeamId={scrim.hostTeamId}
                        captainTeams={captainTeams}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
