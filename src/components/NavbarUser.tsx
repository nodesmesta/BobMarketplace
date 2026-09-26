"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Spinner,
} from "@nextui-org/react";
import {
  IconBrandGithub,
  IconLayoutDashboard,
  IconPlus,
  IconLogout,
  IconChevronDown,
} from "@tabler/icons-react";
import { supabase } from "@/lib/supabase/supabaseClient";
import type { User } from "@supabase/supabase-js";

export default function NavbarUser() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="h-9 w-20 flex items-center justify-center">
        <Spinner size="sm" color="primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Button
        as={Link}
        href="/login"
        size="sm"
        className="bg-[#161922] hover:bg-[#222735] text-zinc-200 border border-[#222735] font-medium px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition text-xs"
        startContent={<IconBrandGithub size={16} stroke={1.5} />}
      >
        Sign In
      </Button>
    );
  }

  const username =
    user.user_metadata?.user_name ||
    user.user_metadata?.preferred_username ||
    user.email?.split("@")[0] ||
    "developer";
  const avatarUrl =
    user.user_metadata?.avatar_url || `https://github.com/${username}.png`;

  return (
    <Dropdown placement="bottom-end" className="bg-[#161922] border border-[#222735]">
      <DropdownTrigger>
        <button className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl bg-[#161922] border border-[#222735] hover:border-[#0F62FE]/60 transition cursor-pointer outline-none">
          <Avatar
            src={avatarUrl}
            name={username}
            size="sm"
            className="w-6 h-6 border border-[#222735]"
          />
          <span className="text-xs font-semibold text-white max-w-[100px] truncate">
            {username}
          </span>
          <IconChevronDown size={14} className="text-zinc-400" stroke={1.5} />
        </button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="User navigation"
        className="text-zinc-300 text-xs"
      >
        <DropdownItem
          key="profile"
          isReadOnly
          className="h-12 gap-2 opacity-100 cursor-default border-b border-[#222735]"
        >
          <div className="text-[11px] text-zinc-400">Signed in with GitHub</div>
          <div className="font-bold text-white text-xs">@{username}</div>
        </DropdownItem>
        <DropdownItem
          key="dashboard"
          as={Link}
          href="/dashboard"
          startContent={<IconLayoutDashboard size={16} stroke={1.5} />}
          className="hover:text-white"
        >
          Publisher Dashboard
        </DropdownItem>
        <DropdownItem
          key="publish"
          as={Link}
          href="/publish"
          startContent={<IconPlus size={16} stroke={1.5} />}
          className="hover:text-white"
        >
          Publish Package
        </DropdownItem>
        <DropdownItem
          key="logout"
          color="danger"
          className="text-red-400 hover:text-red-300"
          startContent={<IconLogout size={16} stroke={1.5} />}
          onPress={handleSignOut}
        >
          Sign Out
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
