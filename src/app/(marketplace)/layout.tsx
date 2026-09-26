"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { Button } from "@nextui-org/react";
import {
  IconPackage,
  IconMenu2,
  IconPlus,
  IconLayoutDashboard,
} from "@tabler/icons-react";
import NavbarUser from "@/components/NavbarUser";
import MarketplaceSidebar from "@/components/MarketplaceSidebar";
import CliBanner from "@/components/CliBanner";

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0D11] text-[#ECEDEE] flex flex-col">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 h-16 backdrop-blur-md bg-[#0B0D11]/90 border-b border-[#222735] px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-[#161922] border border-[#222735]"
            title="Toggle Navigation"
          >
            <IconMenu2 size={18} stroke={1.5} />
          </button>

          <Link href="/" className="flex items-center gap-2.5 font-bold text-white hover:opacity-90 transition">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0F62FE] to-[#8A3FFC] flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
              <IconPackage size={20} stroke={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight leading-none text-white">
                Bob <span className="text-[#0F62FE]">Marketplace</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase mt-0.5">
                Public Extension Registry
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Button
            as={Link}
            href="/dashboard"
            size="sm"
            variant="flat"
            className="text-xs font-semibold bg-[#161922] text-zinc-300 hover:text-white border border-[#222735] hidden sm:flex items-center gap-1.5"
            startContent={<IconLayoutDashboard size={15} stroke={1.5} />}
          >
            Publisher Workspace
          </Button>

          <Button
            as={Link}
            href="/publish"
            size="sm"
            color="primary"
            className="text-xs font-semibold shadow-lg shadow-blue-500/20 flex items-center gap-1.5"
            startContent={<IconPlus size={15} stroke={1.5} />}
          >
            Publish
          </Button>

          <NavbarUser />
        </div>
      </header>

      {/* 2. MAIN BODY WITH DOCKED LEFT SIDEBAR & CONTENT */}
      <div className="flex-1 flex relative">
        {/* Mobile Backdrop Overlay */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
          />
        )}

        {/* Pure Public Catalog Sidebar */}
        <Suspense fallback={<div className="w-72 bg-[#12151D] border-r border-[#222735] hidden lg:block" />}>
          <MarketplaceSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
        </Suspense>

        {/* Scrollable Right Content Column */}
        <div className="lg:pl-72 flex-1 flex flex-col min-w-0">
          {/* Single CLI Banner: Positioned directly below top navbar, strictly within content column */}
          <CliBanner />

          <main className="flex-1 p-6 md:p-8 lg:p-10 w-full">
            {children}
          </main>

          <footer className="border-t border-[#222735] bg-[#0B0D11] py-6 px-6 md:px-8 lg:px-10 text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-400">Bob Marketplace</span>
              <span>&bull;</span>
              <span>Decentralized Package Registry for IBM Bob 2.0</span>
            </div>

            <div className="flex items-center gap-4 text-zinc-400">
              <Link href="/" className="hover:text-white transition">Catalog</Link>
              <Link href="/dashboard" className="hover:text-white transition">Dashboard</Link>
              <Link href="/publish" className="hover:text-white transition">Publish</Link>
              <a href="https://github.com/nodesmesta/BobMarketplace" target="_blank" rel="noreferrer" className="hover:text-white transition">
                GitHub
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
