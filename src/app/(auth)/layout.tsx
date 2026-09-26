import Link from "next/link";
import { IconPackage, IconSparkles } from "@tabler/icons-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0B0D11]">
      <header className="border-b border-[#222735] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white hover:opacity-90 transition">
          <div className="w-8 h-8 rounded-lg bg-[#0F62FE] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <IconPackage size={20} stroke={1.5} />
          </div>
          <span>Bob <span className="text-[#0F62FE]">Marketplace</span></span>
        </Link>
        <div className="flex items-center gap-2 text-xs text-zinc-400 bg-[#161922] px-3 py-1.5 rounded-full border border-[#222735]">
          <IconSparkles size={14} className="text-[#8A3FFC]" stroke={1.5} />
          <span>IBM Bob 2.0 Official Ecosystem</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        {children}
      </main>

      <footer className="border-t border-[#222735] py-4 text-center text-xs text-zinc-500">
        &copy; {new Date().getFullYear()} Bob Marketplace. Built for IBM Bob 2.0 Hackathon.
      </footer>
    </div>
  );
}
