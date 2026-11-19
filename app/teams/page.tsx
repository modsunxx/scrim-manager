import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  DeleteTeamButton,
  InviteCodeBox,
  MemberControls,
  TeamForms,
} from "./team-client";

export default async function TeamsPage() {
  const [currentUser, teams] = await Promise.all([
    getCurrentUser(),
    prisma.team.findMany({
      include: {
        members: {
          include: {
            user: {
              select: { id: true, gamerTag: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

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
            Team & Roster Management
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            สร้างทีม จัดการรายชื่อผู้เล่น และแชร์ Invite Code
            เพื่อดึงเพื่อนเข้าทีม
          </p>
        </div>

        {/* ฟอร์มสร้างทีม และ จอยทีม */}
        <TeamForms isLoggedIn={Boolean(currentUser)} />

        {/* รายชื่อทีมทั้งหมด */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            ทีมทั้งหมดในระบบ ({teams.length})
          </h2>

          {teams.length === 0 ? (
            <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-sm">
              ยังไม่มีทีมในระบบ ลองสร้างทีมแรกจากฟอร์มด้านบนได้เลย
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.map((team) => {
                // เช็กว่าผู้ใช้ที่เปิดดูอยู่ เป็น CAPTAIN ของทีมนี้หรือไม่
                const isCaptain = team.members.some(
                  (m) => m.userId === currentUser?.id && m.role === "CAPTAIN",
                );
                const isMember = team.members.some(
                  (m) => m.userId === currentUser?.id,
                );

                return (
                  <div
                    key={team.id}
                    className={`bg-zinc-900 border rounded-xl p-5 flex flex-col justify-between space-y-4 ${
                      isMember ? "border-emerald-500/30" : "border-zinc-800"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Link
                          href={`/teams/${team.id}`}
                          className="flex items-center gap-2 group"
                        >
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-2 py-0.5 rounded">
                            {team.tag}
                          </span>
                          <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition">
                            {team.name}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-zinc-500">
                            {team.members.length} สมาชิก
                          </span>
                          {isCaptain && <DeleteTeamButton teamId={team.id} />}
                        </div>
                      </div>

                      {/* แสดง Invite Code เฉพาะ Captain ของทีมนี้ */}
                      {isCaptain && (
                        <InviteCodeBox
                          teamId={team.id}
                          inviteCode={team.inviteCode}
                        />
                      )}

                      {/* รายชื่อสมาชิกในทีม (Roster) */}
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                          Active Roster
                        </p>
                        <ul className="divide-y divide-zinc-800/80 bg-zinc-950/60 rounded-lg border border-zinc-800/80">
                          {team.members.map((member) => (
                            <li
                              key={member.id}
                              className="flex items-center justify-between px-3 py-2 text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-zinc-200">
                                  {member.user.gamerTag}
                                </span>
                                {member.role === "CAPTAIN" ? (
                                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded">
                                    CPT
                                  </span>
                                ) : (
                                  !isCaptain && (
                                    <span className="text-[10px] text-zinc-500">
                                      {member.role}
                                    </span>
                                  )
                                )}
                              </div>

                              {/* แสดงปุ่มเปลี่ยนตำแหน่ง/เตะ เฉพาะ Captain */}
                              {isCaptain && (
                                <MemberControls
                                  memberId={member.id}
                                  currentRole={member.role}
                                  isSelf={member.userId === currentUser?.id}
                                />
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
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
