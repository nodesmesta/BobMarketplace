"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@nextui-org/react";
import {
  IconMenu2,
  IconChevronRight,
  IconWorld,
} from "@tabler/icons-react";
import NavbarUser from "@/components/NavbarUser";
import DashboardSidebar from "@/components/DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isPublishPage = pathname.includes("/publish");

  return (
    <div className="min-h-screen bg-[#0B0D11] text-[#ECEDEE] flex">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* DOCKED LEFT-EDGE PUBLISHER SIDEBAR */}
      <DashboardSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* RIGHT CONTENT COLUMN */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Dashboard Top Header */}
        <header className="sticky top-0 z-30 h-16 backdrop-blur-md bg-[#0B0D11]/90 border-b border-[#222735] px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-[#161922] border border-[#222735]"
              title="Open Navigation"
            >
              <IconMenu2 size={18} stroke={1.5} />
            </button>

            {/* Contextual Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-medium">
              <Link href="/dashboard" className="text-zinc-400 hover:text-white transition">
                Publisher Workspace
              </Link>
              <IconChevronRight size={13} className="text-zinc-600" />
              <span className="text-white font-semibold">
                {isPublishPage ? "Publish New Extension" : "My Packages"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              as={Link}
              href="/"
              size="sm"
              variant="bordered"
              className="text-xs font-medium border-[#222735] text-zinc-300 hover:text-white hidden sm:flex items-center gap-1.5"
              startContent={<IconWorld size={15} stroke={1.5} />}
            >
              Public Marketplace
            </Button>

            <NavbarUser />
          </div>
        </header>

        {/* Workspace Content */}
        <main className="flex-1 p-6 md:p-8 w-full max-w-7xl mx-auto">
          {children}
        </main>

        <footer className="border-t border-[#222735] bg-[#0B0D11] py-5 px-8 text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-400">Publisher Workspace</span>
            <span>&bull;</span>
            <span>IBM Bob 2.0 Extension Creator Portal</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <Link href="/" className="hover:text-white transition">Marketplace Home</Link>
            <Link href="/dashboard" className="hover:text-white transition">My Packages</Link>
            <Link href="/publish" className="hover:text-white transition">Publish</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
