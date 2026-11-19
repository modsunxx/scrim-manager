import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logoutUser } from "@/app/actions/auth";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="bg-zinc-900/80 border-b border-zinc-800 sticky top-0 z-50 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-white tracking-tight">
            SCRIM<span className="text-emerald-400">.GG</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-xs font-medium text-zinc-400">
            <Link href="/teams" className="hover:text-white transition">
              Teams
            </Link>
            <Link href="/scrims" className="hover:text-white transition">
              Scrim Finder
            </Link>
            <Link href="/tournaments" className="hover:text-white transition">
              Tournaments
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-full text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-white">
                  {user.gamerTag}
                </span>
                <span className="text-[10px] text-zinc-400 uppercase">
                  ({user.role})
                </span>
              </div>
              <form action={logoutUser}>
                <button
                  type="submit"
                  className="text-xs text-zinc-400 hover:text-rose-400 transition px-2 py-1"
                >
                  ออกจากระบบ
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3.5 py-1.5 rounded-lg transition"
            >
              เข้าสู่ระบบ / สมัครสมาชิก
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
