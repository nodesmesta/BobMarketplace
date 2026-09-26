"use client";

import { Snippet } from "@nextui-org/react";
import { IconTerminal2, IconSparkles } from "@tabler/icons-react";

export default function CliBanner() {
  return (
    <div className="w-full bg-[#12151D] border-b border-[#222735] px-6 md:px-8 lg:px-10 py-2.5 flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-2.5 text-xs text-zinc-300">
        <span className="flex items-center justify-center w-5 h-5 rounded-md bg-[#0F62FE]/20 text-[#0F62FE]">
          <IconTerminal2 size={13} stroke={2} />
        </span>
        <span className="font-medium text-white">One-Line Terminal Setup:</span>
        <span className="text-zinc-400 hidden sm:inline">
          Initialize IBM Bob native chat modes & MCP tools
        </span>
      </div>

      <Snippet
        size="sm"
        symbol=""
        className="bg-[#0B0D11] text-zinc-300 font-mono text-[11px] border border-[#222735] h-7 px-2.5"
      >
        npx bob-marketplace init
      </Snippet>
    </div>
  );
}
