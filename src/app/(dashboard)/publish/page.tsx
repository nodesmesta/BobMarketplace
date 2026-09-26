"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Button,
  Divider,
  Avatar,
  Spinner,
} from "@nextui-org/react";
import {
  IconBrandGithub,
  IconRocket,
  IconCheck,
  IconAlertCircle,
  IconLock,
  IconArrowLeft,
  IconShieldCheck,
} from "@tabler/icons-react";
import { supabase } from "@/lib/supabase/supabaseClient";
import { parseGithubUrl } from "@/lib/github/parseGithubUrl";
import type { User } from "@supabase/supabase-js";

export default function PublishPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
              To ensure package integrity and verify repository ownership, you must sign in with your GitHub account before publishing extensions.
            </p>
          </CardHeader>
          <CardBody className="py-6 flex flex-col gap-3">
            <Button
              as={Link}
              href="/login?next=/publish"
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
  const avatarUrl =
    user.user_metadata?.avatar_url || `https://github.com/${authenticatedUsername}.png`;

  // Ownership verification check on client side using shared generic parser
  const parsedRepo = parseGithubUrl(repoUrl);
  const repoOwner = parsedRepo?.owner ?? null;
  const isOwnershipMismatch =
    Boolean(repoUrl && repoOwner && repoOwner.toLowerCase() !== authenticatedUsername.toLowerCase());

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;

    if (isOwnershipMismatch) {
      setStatusMsg({
        type: "error",
        text: `Ownership verification failed: You can only publish repositories belonging to your own GitHub account (@${authenticatedUsername}). The repository '${repoOwner}' does not match your account.`,
      });
      return;
    }

    try {
      setLoading(true);
      setStatusMsg(null);

      const res = await fetch("/api/v1/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setStatusMsg({
          type: "error",
          text: json.error || "Failed to publish package.",
        });
        return;
      }

      setStatusMsg({
        type: "success",
        text: `Package '${json.data.name}' (v${json.data.version}) published successfully! Redirecting...`,
      });

      setTimeout(() => {
        router.push(`/packages/${json.data.name}`);
      }, 1500);
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err?.message || "An unexpected network error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Back to Workspace Navigation */}
      <div>
        <Link
          href="/dashboard"
          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition w-fit py-1.5 px-3 rounded-xl bg-[#161922] border border-[#222735] hover:border-[#0F62FE]"
        >
          <IconArrowLeft size={15} stroke={1.5} />
          <span>Back to My Packages</span>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Publish Package</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Zero-build GitHub importer: Import and publish an IBM Bob extension directly from your public GitHub repository.
        </p>
      </div>

      <Card className="bg-[#161922] border border-[#222735] p-2 shadow-2xl">
        <form onSubmit={handlePublish}>
          <CardHeader className="flex flex-col items-start gap-1 p-6 pb-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <IconBrandGithub size={22} className="text-[#0F62FE]" stroke={1.5} />
              <span>Repository Details</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Your repository must contain a valid <code>bob-package.json</code> manifest at its root or within a declared subdirectory path.
            </p>
          </CardHeader>

          <CardBody className="p-6 flex flex-col gap-5">
            {/* Publisher Identity (Locked & Verified) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300">
                Verified Publisher Identity
              </label>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0B0D11] border border-[#222735]">
                <Avatar
                  src={avatarUrl}
                  name={authenticatedUsername}
                  size="sm"
                  className="border border-[#222735]"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>@{authenticatedUsername}</span>
                    <IconShieldCheck size={16} className="text-[#0F62FE]" stroke={2} />
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Authenticated via GitHub OAuth &bull; Publisher username is locked to your account
                  </div>
                </div>
              </div>
            </div>

            {/* Public GitHub Repository URL */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300">
                Public GitHub Repository URL
              </label>
              <Input
                size="md"
                placeholder={`https://github.com/${authenticatedUsername}/my-bob-extension`}
                startContent={<IconBrandGithub size={18} className="text-zinc-500" stroke={1.5} />}
                value={repoUrl}
                onValueChange={setRepoUrl}
                required
                classNames={{
                  inputWrapper: `bg-[#0B0D11] border ${
                    isOwnershipMismatch
                      ? "border-red-500/80 hover:border-red-500"
                      : "border-[#222735] hover:border-[#0F62FE]"
                  }`,
                  input: "text-white placeholder:text-zinc-600 font-mono text-sm",
                }}
              />
              <span className="text-[11px] text-zinc-500">
                Accepted formats:{" "}
                <code>https://github.com/{authenticatedUsername}/repo</code>
                {" "}or{" "}
                <code>https://github.com/{authenticatedUsername}/repo/tree/main/subdirectory</code>
              </span>
            </div>

            {/* Ownership Warning Notice */}
            {isOwnershipMismatch && (
              <div className="p-3.5 rounded-xl border bg-red-500/10 border-red-500/30 text-red-400 text-xs flex items-start gap-2.5">
                <IconAlertCircle size={18} className="shrink-0 mt-0.5 text-red-400" stroke={2} />
                <div>
                  <div className="font-semibold">Repository Ownership Mismatch</div>
                  <div className="text-red-300 mt-0.5">
                    You can only publish repositories belonging to your authenticated GitHub account (<strong>@{authenticatedUsername}</strong>). The repository owner <strong>@{repoOwner}</strong> does not match your credentials.
                  </div>
                </div>
              </div>
            )}

            {/* Status Feedback Banner */}
            {statusMsg && (
              <div
                className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                  statusMsg.type === "success"
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}
              >
                {statusMsg.type === "success" ? (
                  <IconCheck size={18} className="shrink-0 text-green-400" stroke={2} />
                ) : (
                  <IconAlertCircle size={18} className="shrink-0 text-red-400" stroke={2} />
                )}
                <span>{statusMsg.text}</span>
              </div>
            )}
          </CardBody>

          <Divider className="bg-[#222735]" />

          <CardFooter className="p-6 flex justify-between items-center bg-[#0B0D11]/30">
            <span className="text-xs text-zinc-500">
              Bundle archives are immutably served via Supabase CDN.
            </span>
            <Button
              type="submit"
              color="primary"
              size="md"
              isLoading={loading}
              isDisabled={Boolean(isOwnershipMismatch || !repoUrl)}
              className="font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-50"
              startContent={!loading && <IconRocket size={18} stroke={1.5} />}
            >
              Publish Package
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
