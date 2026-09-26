"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Chip } from "@nextui-org/react";
import { IconBox } from "@tabler/icons-react";

export interface CategoryItem {
  key: string;
  label: string;
}

export const CATALOG_CATEGORIES: CategoryItem[] = [
  { key: "all", label: "ALL PACKAGES" },
  { key: "agent", label: "AGENTS" },
  { key: "skill", label: "SKILLS" },
  { key: "plugin", label: "PLUGINS" },
  { key: "tool", label: "TOOLS" },
  { key: "mcp", label: "MCP" },
  { key: "hook", label: "HOOKS" },
  { key: "rule", label: "RULES" },
  { key: "config", label: "CONFIGS" },
];

const SUB_CATEGORIES = CATALOG_CATEGORIES.filter((c) => c.key !== "all");

export default function MarketplaceSidebar({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentCategory = searchParams.get("category") || "all";

  const handleCategoryClick = (categoryKey: string) => {
    if (categoryKey === "all") {
      router.push("/");
    } else {
      router.push(`/?category=${categoryKey}`);
    }
    if (onCloseMobile) onCloseMobile();
  };

  const isAllActive = currentCategory === "all";

  return (
    <aside
      className={`fixed top-16 bottom-0 left-0 w-64 lg:w-72 bg-[#12151D] border-r border-[#222735] flex flex-col z-40 transition-transform duration-300 ease-in-out ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-[#222735]">
        {/* Categories Section */}
        <div className="space-y-2">
          <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
            <span>CATEGORIES</span>
            <Chip size="sm" variant="flat" color="primary" className="text-[10px] h-5 font-mono">
              8 TYPES
            </Chip>
          </div>

          <div className="flex flex-col gap-1">
            {/* Top-Level: All Packages with Icon */}
            <button
              onClick={() => handleCategoryClick("all")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition text-xs font-bold uppercase tracking-wider ${
                isAllActive
                  ? "bg-[#0F62FE] text-white shadow-lg shadow-blue-500/10"
                  : "text-zinc-300 hover:text-white hover:bg-[#222735]/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <IconBox
                  size={16}
                  stroke={2}
                  className={isAllActive ? "text-white" : "text-[#0F62FE]"}
                />
                <span>ALL PACKAGES</span>
              </div>
              {isAllActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </button>

            {/* Indented Sub-Menu Items (No Icons, Indented Right) */}
            <div className="ml-4 pl-3.5 border-l border-[#222735] flex flex-col gap-1 mt-1">
              {SUB_CATEGORIES.map((cat) => {
                const isActive = currentCategory === cat.key;

                return (
                  <button
                    key={cat.key}
                    onClick={() => handleCategoryClick(cat.key)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition text-[11px] font-semibold uppercase tracking-wider ${
                      isActive
                        ? "bg-[#0F62FE]/15 text-[#0F62FE] border border-[#0F62FE]/30"
                        : "text-zinc-400 hover:text-white hover:bg-[#222735]/40"
                    }`}
                  >
                    <span>{cat.label}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#0F62FE]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Resources Links */}
        <div className="space-y-1 pt-3 border-t border-[#222735]/60">
          <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            RESOURCES
          </div>
          <div className="flex flex-col gap-0.5">
            <a
              href="https://github.com/nodesmesta/BobMarketplace"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-[#222735]/60 transition font-medium"
            >
              <span>GitHub Repository</span>
              <span className="text-zinc-600 text-[11px]">&rarr;</span>
            </a>
            <a
              href="https://lablab.ai"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-[#222735]/60 transition font-medium"
            >
              <span>LabLab.ai Submission</span>
              <span className="text-zinc-600 text-[11px]">&rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
