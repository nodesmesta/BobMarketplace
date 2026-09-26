"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardBody, CardFooter, Button, Divider, Spinner } from "@nextui-org/react";
import { IconBrandGithub, IconShieldCheck, IconPackage, IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/supabaseClient";

function LoginContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const handleGithubLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  };

  return (
    <Card className="max-w-md w-full bg-[#161922] border border-[#222735] shadow-2xl p-2">
      <CardHeader className="flex flex-col gap-2 items-center text-center pt-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0F62FE] to-[#8A3FFC] flex items-center justify-center text-white shadow-xl shadow-blue-500/20 mb-2">
          <IconPackage size={30} stroke={1.5} />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Publisher Sign In</h1>
        <p className="text-sm text-zinc-400 max-w-xs">
          Sign in with your GitHub account to publish, update, and manage your IBM Bob AI extensions.
        </p>
      </CardHeader>

      <CardBody className="py-6 px-4 flex flex-col gap-4">
        <Button
          size="lg"
          className="w-full bg-white hover:bg-zinc-100 text-black font-semibold flex items-center justify-center gap-3 transition"
          onPress={handleGithubLogin}
        >
          <IconBrandGithub size={22} stroke={1.5} />
          <span>Continue with GitHub</span>
        </Button>

        <div className="flex items-center gap-2 text-xs text-zinc-500 bg-[#0B0D11] p-3 rounded-lg border border-[#222735]">
          <IconShieldCheck size={18} className="text-[#0F62FE] shrink-0" stroke={1.5} />
          <span>
            Zero-build publishing reads <code>bob-package.json</code> directly from public GitHub repos.
          </span>
        </div>
      </CardBody>

      <Divider className="bg-[#222735]" />

      <CardFooter className="flex justify-center py-4">
        <Link
          href="/"
          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition"
        >
          <IconArrowLeft size={16} stroke={1.5} />
          <span>Back to Marketplace</span>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" color="primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
