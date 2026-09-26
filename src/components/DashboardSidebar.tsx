"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@nextui-org/react";
import {
  IconPackage,
  IconLogout,
  IconX,
} from "@tabler/icons-react";
import { supabase } from "@/lib/supabase/supabaseClient";

export default function DashboardSidebar({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const navItems = [
    {
      label: "My Packages",
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "Publish Package",
      href: "/publish",
      active: pathname === "/publish",
    },
  ];

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 w-64 lg:w-72 bg-[#12151D] border-r border-[#222735] flex flex-col z-50 transition-transform duration-300 ease-in-out ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      {/* Dashboard Sidebar Header */}
      <div className="p-4 border-b border-[#222735] flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 font-bold text-white hover:opacity-90 transition"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0F62FE] to-[#8A3FFC] flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
            <IconPackage size={20} stroke={1.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold tracking-tight text-white leading-none">
              Bob <span className="text-[#0F62FE]">Workspace</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase mt-0.5">
              Publisher Dashboard
            </span>
          </div>
        </Link>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#222735]"
          >
            <IconX size={18} stroke={1.5} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-[#222735]">
        {/* Workspace Management Menu */}
        <div className="space-y-1">
          <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Management
          </div>
          <div className="flex flex-col gap-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  item.active
                    ? "bg-[#0F62FE] text-white shadow-lg shadow-blue-500/10"
                    : "text-zinc-400 hover:text-white hover:bg-[#222735]/60"
                }`}
              >
                <span>{item.label}</span>
                {item.active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </Link>
            ))}
          </div>
        </div>

        {/* Back to Public Marketplace Link */}
        <div className="space-y-1 pt-3 border-t border-[#222735]/60">
          <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Navigation
          </div>
          <div className="flex flex-col gap-0.5">
            <Link
              href="/"
              onClick={onCloseMobile}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-[#222735]/60 transition"
            >
              <span>Public Marketplace</span>
              <span className="text-zinc-500 text-[11px]">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Sidebar Footer: Sign Out */}
      <div className="p-3.5 border-t border-[#222735] bg-[#0B0D11]/60">
        <Button
          size="sm"
          variant="light"
          color="danger"
          onPress={handleSignOut}
          className="w-full text-xs font-semibold justify-start text-red-400 hover:text-red-300"
          startContent={<IconLogout size={16} stroke={1.5} />}
        >
          Sign Out of Workspace
        </Button>
      </div>
    </aside>
  );
}
