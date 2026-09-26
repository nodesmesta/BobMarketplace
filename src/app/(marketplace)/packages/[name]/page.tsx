"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Chip,
  Button,
  Snippet,
  Tabs,
  Tab,
  Card,
  Avatar,
  Divider,
  Spinner,
} from "@nextui-org/react";
import {
  IconBrandGithub,
  IconDownload,
  IconArrowLeft,
  IconCheck,
  IconFileCode,
  IconTerminal2,
  IconStar,
  IconGitFork,
  IconBug,
} from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PackageDetailPageProps {
  params: {
    name: string;
  };
}

export default function PackageDetailPage({ params }: PackageDetailPageProps) {
  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/packages/${params.name}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setPkg(json.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.name]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Spinner color="primary" size="lg" />
        <span className="text-sm">Loading package details...</span>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="py-24 text-center flex flex-col items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Package not found</h2>
        <Link href="/" className="text-[#0F62FE] hover:underline text-sm">
          &larr; Back to Catalog
        </Link>
      </div>
    );
  }

  const latestRelease = pkg.latest_release || {};
  const manifest = latestRelease.manifest || {};
  const readmeContent = latestRelease.readme_content || "# " + pkg.display_name + "\n\nNo README provided.";

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Contextual Navigation Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/"
          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition w-fit py-1 px-2.5 rounded-lg hover:bg-[#161922] border border-[#222735]"
        >
          <IconArrowLeft size={16} stroke={1.5} />
          <span>Back to Catalog</span>
        </Link>

        <div className="flex items-center gap-3 text-xs">
          <Link
            href={`/?category=${pkg.category}`}
            className="text-zinc-400 hover:text-[#0F62FE] transition capitalize"
          >
            Category: <strong className="text-zinc-200">{pkg.category}</strong>
          </Link>
          <span className="text-zinc-600">&bull;</span>
          <Link
            href="/dashboard"
            className="text-zinc-400 hover:text-white transition"
          >
            Publisher Workspace &rarr;
          </Link>
        </div>
      </div>

      {/* Package Header Card */}
      <div className="bg-[#161922] border border-[#222735] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-start gap-4">
          <Avatar
            src={pkg.publishers?.avatar_url}
            name={pkg.publishers?.username || "Dev"}
            className="w-16 h-16 text-lg border-2 border-[#222735] shrink-0"
          />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {pkg.display_name}
              </h1>
              <Chip size="sm" color="primary" variant="flat" className="font-mono text-xs">
                v{pkg.latest_version}
              </Chip>
              {pkg.is_verified && (
                <Chip size="sm" variant="bordered" className="border-blue-500/30 text-[#0F62FE] text-xs">
                  Verified
                </Chip>
              )}
            </div>

            <p className="text-sm text-zinc-400 max-w-xl">
              {pkg.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1 flex-wrap">
              <span>Published by <strong className="text-zinc-200">@{pkg.publishers?.username}</strong></span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 text-amber-400" title="GitHub Stars">
                <IconStar size={14} className="fill-amber-400/20" stroke={1.8} />
                <strong className="text-zinc-200 font-semibold">{pkg.stars ?? 0}</strong> stars
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 text-zinc-300" title="GitHub Forks">
                <IconGitFork size={14} stroke={1.8} />
                <strong className="text-zinc-200 font-semibold">{pkg.forks ?? 0}</strong> forks
              </span>
              {pkg.downloads > 0 && (
                <>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <IconDownload size={14} className="text-zinc-500" stroke={1.5} />
                    {pkg.downloads} downloads
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
          {pkg.repo_url && (
            <Button
              as="a"
              href={pkg.repo_url}
              target="_blank"
              rel="noreferrer"
              variant="bordered"
              size="md"
              className="border-[#222735] text-zinc-200 hover:text-white hover:border-zinc-500"
              startContent={<IconBrandGithub size={18} stroke={1.5} />}
            >
              GitHub Repo
            </Button>
          )}

          {pkg.repo_url && (
            <Button
              as="a"
              href={`${pkg.repo_url}/issues/new`}
              target="_blank"
              rel="noreferrer"
              variant="bordered"
              size="md"
              className="border-[#222735] text-zinc-300 hover:text-white hover:border-zinc-500"
              startContent={<IconBug size={17} stroke={1.5} className="text-amber-400" />}
            >
              Report Issue
            </Button>
          )}

          <Button
            as="a"
            href={`/api/v1/packages/${pkg.name}/download`}
            color="primary"
            size="md"
            className="shadow-lg shadow-blue-500/20 font-semibold"
            startContent={<IconDownload size={18} stroke={1.5} />}
          >
            Download Bundle
          </Button>
        </div>
      </div>

      {/* Quick Install Banner */}
      <div className="bg-[#0B0D11] border border-[#222735] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-xl bg-[#0F62FE]/20 flex items-center justify-center text-[#0F62FE] shrink-0">
            <IconTerminal2 size={20} stroke={1.5} />
          </div>
          <div>
            <div className="text-xs text-zinc-400">Install via IBM Bob Chat Panel</div>
            <div className="text-sm font-semibold text-white">Chat Command</div>
          </div>
        </div>
        <Snippet
          size="md"
          symbol=""
          className="bg-[#161922] text-zinc-200 font-mono text-sm border border-[#222735] w-full sm:w-auto"
        >
          {`@marketplace add ${pkg.name}`}
        </Snippet>
      </div>

      {/* Tabs: README, Manifest, and Releases */}
      <Card className="bg-[#161922] border border-[#222735] p-2">
        <Tabs
          aria-label="Package Details"
          color="primary"
          variant="underlined"
          classNames={{
            tabList: "border-b border-[#222735] px-4",
            cursor: "bg-[#0F62FE]",
            tab: "text-zinc-400 data-[selected=true]:text-white font-medium text-sm py-4",
          }}
        >
          {/* Tab 1: README Content */}
          <Tab key="readme" title="README.md">
            <div className="p-6 prose prose-invert max-w-none prose-headings:text-white prose-p:text-zinc-300 prose-code:text-[#0F62FE] prose-code:bg-[#0B0D11] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[#0B0D11] prose-pre:border prose-pre:border-[#222735]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {readmeContent}
              </ReactMarkdown>
            </div>
          </Tab>

          {/* Tab 2: Manifest & Destination Files */}
          <Tab key="manifest" title="Manifest & Files">
            <div className="p-6 flex flex-col gap-6">
              <div>
                <h3 className="text-base font-bold text-white mb-2">Installed Files Mapping</h3>
                <p className="text-xs text-zinc-400 mb-4">
                  The files that will be extracted into your active workspace when installing this package:
                </p>
                <div className="bg-[#0B0D11] rounded-xl border border-[#222735] overflow-hidden">
                  {(manifest.files || []).map((file: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 border-b border-[#222735] last:border-none text-xs font-mono"
                    >
                      <div className="flex items-center gap-2 text-zinc-300">
                        <IconFileCode size={16} className="text-[#0F62FE]" stroke={1.5} />
                        <span>{file.src}</span>
                      </div>
                      <span className="text-zinc-500">&rarr;</span>
                      <span className="text-[#8A3FFC] font-semibold">{file.dest}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Divider className="bg-[#222735]" />

              <div>
                <h3 className="text-base font-bold text-white mb-2">Raw Manifest (`bob-package.json`)</h3>
                <pre className="bg-[#0B0D11] border border-[#222735] rounded-xl p-4 text-xs font-mono text-zinc-300 overflow-x-auto">
                  {JSON.stringify(manifest, null, 2)}
                </pre>
              </div>
            </div>
          </Tab>

          {/* Tab 3: Version History */}
          <Tab key="versions" title="Releases">
            <div className="p-6 flex flex-col gap-4">
              <h3 className="text-base font-bold text-white">Release History</h3>
              <div className="flex flex-col gap-3">
                {(pkg.package_versions || []).map((ver: any) => (
                  <div
                    key={ver.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-[#0B0D11] border border-[#222735]"
                  >
                    <div className="flex items-center gap-3">
                      <Chip size="sm" color="primary" variant="flat" className="font-mono">
                        v{ver.version}
                      </Chip>
                      <span className="text-xs text-zinc-400">
                        Released on {new Date(ver.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <Button
                      as="a"
                      href={ver.bundle_url}
                      size="sm"
                      variant="light"
                      className="text-xs text-[#0F62FE]"
                    >
                      Download tar.gz
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </Tab>
        </Tabs>
      </Card>
    </div>
  );
}
