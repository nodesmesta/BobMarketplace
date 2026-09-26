"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardBody,
  Chip,
  Button,
  Avatar,
  Spinner,
} from "@nextui-org/react";
import {
  IconPackage,
  IconDownload,
  IconPlus,
  IconExternalLink,
  IconBrandGithub,
  IconLock,
  IconArrowLeft,
  IconShieldCheck,
  IconBox,
  IconAdjustments,
} from "@tabler/icons-react";
import { supabase } from "@/lib/supabase/supabaseClient";
import type { User } from "@supabase/supabase-js";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [myPackages, setMyPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const username =
      user.user_metadata?.user_name ||
      user.user_metadata?.preferred_username ||
      user.email?.split("@")[0];

    async function loadData() {
      try {
        setLoading(true);
        // Find publisher ID for this username
        const { data: pubData } = await supabase
          .from("publishers")
          .select("id")
          .eq("username", username)
          .maybeSingle();

        if (pubData) {
          const { data: pkgs } = await supabase
            .from("packages")
            .select("id, name, display_name, latest_version, downloads, category, created_at")
            .eq("publisher_id", pubData.id)
            .order("downloads", { ascending: false });

          setMyPackages(pkgs || []);
        } else {
          // If publisher record doesn't exist yet, empty list
          setMyPackages([]);
        }
      } catch (err) {
        console.error("Failed to load publisher packages:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  if (authLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4 text-zinc-400">
        <Spinner size="lg" color="primary" />
        <span className="text-sm">Authenticating publisher session...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <Card className="bg-[#161922] border border-[#222735] p-6 text-center shadow-2xl">
          <CardHeader className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0F62FE] to-[#8A3FFC] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
              <IconLock size={28} stroke={1.5} />
            </div>
            <h2 className="text-xl font-bold text-white">Publisher Authentication Required</h2>
            <p className="text-xs text-zinc-400 max-w-sm">
              Please sign in with your GitHub account to access your publisher dashboard and manage your extensions.
            </p>
          </CardHeader>
          <CardBody className="py-6 flex flex-col gap-3">
            <Button
              as={Link}
              href="/login"
              color="primary"
              size="lg"
              className="w-full font-semibold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <IconBrandGithub size={20} stroke={1.5} />
              <span>Sign In with GitHub</span>
            </Button>
            <Link
              href="/"
              className="text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1 mt-2"
            >
              <IconArrowLeft size={14} stroke={1.5} />
              <span>Back to Marketplace</span>
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  const authenticatedUsername =
    user.user_metadata?.user_name ||
    user.user_metadata?.preferred_username ||
    user.email?.split("@")[0] ||
    "developer";
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    authenticatedUsername;
  const avatarUrl =
    user.user_metadata?.avatar_url || `https://github.com/${authenticatedUsername}.png`;

  const totalDownloads = myPackages.reduce((acc, p) => acc + (p.downloads || 0), 0);

  return (
    <div className="flex flex-col gap-8">
      {/* Publisher Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl bg-[#161922] border border-[#222735]">
        <div className="flex items-center gap-4">
          <Avatar
            src={avatarUrl}
            name={displayName}
            size="lg"
            className="border-2 border-[#0F62FE]"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">{displayName}</h1>
              <Chip size="sm" variant="flat" color="primary" className="text-[11px] gap-1">
                <IconShieldCheck size={13} className="text-[#0F62FE]" stroke={2} />
                <span>Verified Publisher</span>
              </Chip>
            </div>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
              <span>@{authenticatedUsername}</span>
              <span>&bull;</span>
              <span>GitHub OAuth Account</span>
            </p>
          </div>
        </div>

        <Button
          as={Link}
          href="/publish"
          color="primary"
          size="md"
          className="font-semibold shadow-lg shadow-blue-500/20 shrink-0"
          startContent={<IconPlus size={18} stroke={1.5} />}
        >
          Publish New Package
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-[#161922] border border-[#222735] p-5">
          <div className="text-xs text-zinc-400 font-medium">My Published Packages</div>
          <div className="text-3xl font-bold text-white mt-2">{myPackages.length}</div>
          <div className="text-xs text-[#0F62FE] mt-1">Managed under @{authenticatedUsername}</div>
        </Card>

        <Card className="bg-[#161922] border border-[#222735] p-5">
          <div className="text-xs text-zinc-400 font-medium">My Package Downloads</div>
          <div className="text-3xl font-bold text-white mt-2">{totalDownloads}</div>
          <div className="text-xs text-green-400 mt-1">Across all IBM Bob workspaces</div>
        </Card>

        <Card className="bg-[#161922] border border-[#222735] p-5">
          <div className="text-xs text-zinc-400 font-medium">Registry & CDN Status</div>
          <div className="text-3xl font-bold text-white mt-2">100%</div>
          <div className="text-xs text-[#8A3FFC] mt-1">Supabase Storage CDN active</div>
        </Card>
      </div>

      {/* Packages Table */}
      <Card className="bg-[#161922] border border-[#222735] p-2">
        <CardHeader className="p-4 pb-2">
          <h2 className="text-lg font-bold text-white">My Packages</h2>
        </CardHeader>
        <CardBody className="p-4 pt-2">
          {loading ? (
            <div className="py-12 flex justify-center items-center text-zinc-500">
              <Spinner size="md" color="primary" />
            </div>
          ) : myPackages.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center border border-dashed border-[#222735] rounded-xl p-8">
              <div className="w-12 h-12 rounded-2xl bg-[#0B0D11] flex items-center justify-center text-zinc-500">
                <IconBox size={24} stroke={1.5} />
              </div>
              <h3 className="text-base font-semibold text-white">No packages published yet</h3>
              <p className="text-xs text-zinc-400 max-w-sm">
                You haven&apos;t published any packages from your GitHub account (<strong>@{authenticatedUsername}</strong>).
              </p>
              <Button
                as={Link}
                href="/publish"
                size="sm"
                color="primary"
                className="mt-2 font-semibold"
                startContent={<IconPlus size={16} stroke={1.5} />}
              >
                Publish Your First Package
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#0B0D11] text-zinc-400 border-b border-[#222735]">
                  <tr>
                    <th className="p-3.5 font-semibold">Package Name</th>
                    <th className="p-3.5 font-semibold">Category</th>
                    <th className="p-3.5 font-semibold">Latest Version</th>
                    <th className="p-3.5 font-semibold">Downloads</th>
                    <th className="p-3.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222735]">
                  {myPackages.map((p) => (
                    <tr key={p.id} className="hover:bg-[#0B0D11]/50 transition">
                      <td className="p-3.5 font-semibold text-white">
                        <Link href={`/packages/${p.name}`} className="hover:text-[#0F62FE] transition">
                          {p.display_name}
                        </Link>
                        <div className="text-[11px] font-mono text-zinc-500">{p.name}</div>
                      </td>
                      <td className="p-3.5 capitalize">
                        <Chip size="sm" variant="flat" color="primary" className="text-[11px]">
                          {p.category}
                        </Chip>
                      </td>
                      <td className="p-3.5 font-mono text-zinc-300">v{p.latest_version}</td>
                      <td className="p-3.5 font-semibold text-white">{p.downloads}</td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            as={Link}
                            href={`/dashboard/packages/${p.name}`}
                            size="sm"
                            color="primary"
                            variant="flat"
                            className="text-xs font-semibold"
                            startContent={<IconAdjustments size={14} stroke={1.8} />}
                          >
                            Manage
                          </Button>

                          <Button
                            as={Link}
                            href={`/packages/${p.name}`}
                            size="sm"
                            variant="light"
                            className="text-xs text-zinc-400 hover:text-white"
                            title="View on Public Marketplace"
                            endContent={<IconExternalLink size={14} stroke={1.5} />}
                          >
                            Public
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
