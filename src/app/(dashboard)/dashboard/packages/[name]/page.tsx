"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardBody,
  Chip,
  Button,
  Spinner,
  Snippet,
} from "@nextui-org/react";
import {
  IconArrowLeft,
  IconBrandGithub,
  IconExternalLink,
  IconRocket,
  IconCheck,
  IconAlertCircle,
  IconRefresh,
  IconBug,
  IconDownload,
  IconHistory,
  IconFileCode,
  IconMessageCircle,
} from "@tabler/icons-react";

interface ManagePackagePageProps {
  params: {
    name: string;
  };
}

export default function ManagePackagePage({ params }: ManagePackagePageProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [releasing, setReleasing] = useState(false);
  const [releaseSuccess, setReleaseSuccess] = useState<string | null>(null);
  const [releaseError, setReleaseError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/v1/packages/${params.name}/check-update`);
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Failed to load package management details.");
      } else {
        setData(json.data);
      }
    } catch (err: any) {
      setError(err?.message || "Network error loading package details.");
    } finally {
      setLoading(false);
    }
  }, [params.name]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReleaseUpdate = async () => {
    if (!data?.package?.repo_url) return;

    try {
      setReleasing(true);
      setReleaseError(null);
      setReleaseSuccess(null);

      const res = await fetch("/api/v1/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repoUrl: data.package.repo_url,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setReleaseError(json.error || "Failed to release package update.");
      } else {
        const publishedVer = json.data?.version || data.githubVersion;
        setReleaseSuccess(`Version v${publishedVer} was successfully packaged and deployed to Supabase Registry & CDN!`);
        await loadData();
      }
    } catch (err: any) {
      setReleaseError(err?.message || "An unexpected error occurred during release.");
    } finally {
      setReleasing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4 text-zinc-400">
        <Spinner size="lg" color="primary" />
        <span className="text-sm font-medium">Inspecting package repository & checking updates...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <IconAlertCircle size={24} stroke={2} />
        </div>
        <h2 className="text-xl font-bold text-white">Management Access Error</h2>
        <p className="text-xs text-zinc-400 max-w-md">{error || "Could not retrieve package management data."}</p>
        <Button as={Link} href="/dashboard" color="primary" size="sm" className="mt-2 font-semibold">
          &larr; Back to My Packages
        </Button>
      </div>
    );
  }

  const { package: pkg, versions, registryVersion, githubVersion, hasUpdate, openIssues, openIssuesCount } = data;

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Context Navigation & Breadcrumb */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/dashboard"
          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition py-1.5 px-3 rounded-xl bg-[#161922] border border-[#222735] hover:border-zinc-500"
        >
          <IconArrowLeft size={16} stroke={1.5} />
          <span>Back to My Packages</span>
        </Link>

        <div className="flex items-center gap-3">
          <Button
            as={Link}
            href={`/packages/${pkg.name}`}
            size="sm"
            variant="flat"
            className="text-xs font-semibold bg-[#161922] text-[#0F62FE] hover:text-white border border-[#222735] flex items-center gap-1.5"
            endContent={<IconExternalLink size={14} stroke={1.5} />}
          >
            Public Marketplace Page
          </Button>

          {pkg.repo_url && (
            <Button
              as="a"
              href={pkg.repo_url}
              target="_blank"
              rel="noreferrer"
              size="sm"
              variant="bordered"
              className="text-xs font-semibold border-[#222735] text-zinc-300 hover:text-white flex items-center gap-1.5"
              startContent={<IconBrandGithub size={15} stroke={1.5} />}
            >
              GitHub Repository
            </Button>
          )}
        </div>
      </div>

      {/* Package Header Card */}
      <Card className="bg-[#161922] border border-[#222735] p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {pkg.display_name}
              </h1>
              <Chip size="sm" color="primary" variant="flat" className="font-mono text-xs font-bold">
                v{registryVersion}
              </Chip>
              <Chip size="sm" variant="bordered" className="uppercase text-[10px] font-bold border-[#0F62FE]/30 text-[#0F62FE]">
                {pkg.category}
              </Chip>
            </div>
            <p className="text-sm text-zinc-400 max-w-2xl">{pkg.description}</p>
            <div className="text-xs text-zinc-500 font-mono mt-1 flex items-center gap-3">
              <span>Registry Name: <strong className="text-zinc-300">{pkg.name}</strong></span>
              <span>&bull;</span>
              <span>Maintained by <strong className="text-zinc-300">@{pkg.publishers?.username}</strong></span>
            </div>
          </div>

          <Snippet
            size="sm"
            symbol=""
            className="bg-[#0B0D11] text-zinc-300 font-mono text-xs border border-[#222735]"
          >
            {`@marketplace add ${pkg.name}`}
          </Snippet>
        </div>
      </Card>

      {/* Live Feedback Banners */}
      {releaseSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-3">
          <IconCheck size={18} stroke={2} className="shrink-0" />
          <span>{releaseSuccess}</span>
        </div>
      )}

      {releaseError && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3">
          <IconAlertCircle size={18} stroke={2} className="shrink-0" />
          <span>{releaseError}</span>
        </div>
      )}

      {/* AUTO-DETECTION & ONE-CLICK RELEASE CARD */}
      <Card
        className={`border p-6 shadow-2xl transition-all duration-300 ${
          hasUpdate
            ? "bg-gradient-to-br from-[#121929] to-[#161922] border-[#0F62FE]/60 shadow-blue-500/10"
            : "bg-[#161922] border-[#222735]"
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                hasUpdate
                  ? "bg-[#0F62FE]/20 text-[#0F62FE] border border-[#0F62FE]/40"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              }`}
            >
              {hasUpdate ? <IconRocket size={24} stroke={1.8} /> : <IconCheck size={24} stroke={2} />}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-white">
                  {hasUpdate ? "New Version Detected in Repository" : "Package is Up to Date"}
                </h2>
                {hasUpdate ? (
                  <Chip size="sm" color="primary" variant="solid" className="text-xs font-mono font-bold">
                    GitHub: v{githubVersion}
                  </Chip>
                ) : (
                  <Chip size="sm" variant="flat" color="success" className="text-xs font-mono font-bold">
                    Active: v{registryVersion}
                  </Chip>
                )}
              </div>

              <p className="text-xs text-zinc-400 max-w-xl">
                {hasUpdate
                  ? `Your GitHub repository declares version v${githubVersion}, while the Supabase registry is serving v${registryVersion}. Click below to automatically package and release this update.`
                  : `The Supabase registry version (v${registryVersion}) is in sync with your GitHub repository. To publish a new release, bump the "version" field in bob-package.json and push to GitHub.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {hasUpdate ? (
              <Button
                color="primary"
                size="md"
                isLoading={releasing}
                onPress={handleReleaseUpdate}
                className="font-bold shadow-xl shadow-blue-500/30 w-full sm:w-auto px-6"
                startContent={!releasing && <IconRocket size={18} stroke={1.8} />}
              >
                {releasing ? "Packaging & Updating..." : `Release Update (v${githubVersion})`}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="flat"
                onPress={loadData}
                className="text-xs font-semibold bg-[#0B0D11] text-zinc-300 hover:text-white border border-[#222735]"
                startContent={<IconRefresh size={14} stroke={1.8} />}
              >
                Check for Updates
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* COMMUNITY ISSUES & BUG REPORTS SECTION */}
      <Card className="bg-[#161922] border border-[#222735] p-2 shadow-xl">
        <CardHeader className="p-4 pb-2 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <IconBug size={18} stroke={1.5} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Community Issues & Feedback</h2>
              <p className="text-xs text-zinc-500">Live open issues filed by IBM Bob users on your GitHub repository</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Chip size="sm" variant="flat" className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
              {openIssuesCount} Open {openIssuesCount === 1 ? "Issue" : "Issues"}
            </Chip>

            {pkg.repo_url && (
              <Button
                as="a"
                href={`${pkg.repo_url}/issues`}
                target="_blank"
                rel="noreferrer"
                size="sm"
                variant="bordered"
                className="text-xs font-semibold border-[#222735] text-zinc-300 hover:text-white"
                endContent={<IconExternalLink size={13} stroke={1.5} />}
              >
                View on GitHub
              </Button>
            )}
          </div>
        </CardHeader>

        <CardBody className="p-4 pt-2">
          {openIssues.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-center border border-dashed border-[#222735] rounded-xl p-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <IconCheck size={20} stroke={2} />
              </div>
              <h3 className="text-sm font-semibold text-white">No Open Issues Found</h3>
              <p className="text-xs text-zinc-400 max-w-sm">
                There are currently no open bug reports or feature requests on your GitHub repository.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[#222735]">
              {openIssues.map((issue: any) => (
                <div key={issue.id} className="py-3.5 flex items-start justify-between gap-4 group">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="font-mono text-xs text-zinc-500 mt-0.5">#{issue.number}</span>
                    <div className="min-w-0">
                      <a
                        href={issue.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-white group-hover:text-[#0F62FE] transition truncate block"
                      >
                        {issue.title}
                      </a>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1 flex-wrap">
                        <span>Opened by <strong>@{issue.user?.login}</strong></span>
                        <span>&bull;</span>
                        <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                        {issue.comments > 0 && (
                          <>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1 text-zinc-400">
                              <IconMessageCircle size={13} stroke={1.5} />
                              <span>{issue.comments}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {issue.labels && issue.labels.slice(0, 2).map((label: any) => (
                      <span
                        key={label.id}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium border"
                        style={{
                          backgroundColor: `#${label.color}15`,
                          borderColor: `#${label.color}40`,
                          color: `#${label.color}`,
                        }}
                      >
                        {label.name}
                      </span>
                    ))}
                    <Button
                      as="a"
                      href={issue.html_url}
                      target="_blank"
                      rel="noreferrer"
                      size="sm"
                      variant="light"
                      className="text-xs text-[#0F62FE]"
                    >
                      Reply &rarr;
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* IMMUTABLE VERSION SNAPSHOTS & CDN STORAGE BUNDLES */}
      <Card className="bg-[#161922] border border-[#222735] p-2 shadow-xl">
        <CardHeader className="p-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0F62FE]/10 border border-[#0F62FE]/20 flex items-center justify-center text-[#0F62FE]">
              <IconHistory size={18} stroke={1.5} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Immutable Version History</h2>
              <p className="text-xs text-zinc-500">Every published release snapshot is permanently archived on Supabase Storage</p>
            </div>
          </div>

          <Chip size="sm" variant="flat" color="primary" className="text-xs font-mono font-semibold">
            {versions.length} {versions.length === 1 ? "Release" : "Releases"}
          </Chip>
        </CardHeader>

        <CardBody className="p-4 pt-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-[#0B0D11] text-zinc-400 border-b border-[#222735]">
                <tr>
                  <th className="p-3.5 font-semibold">Version Tag</th>
                  <th className="p-3.5 font-semibold">Release Date</th>
                  <th className="p-3.5 font-semibold">Manifest Files</th>
                  <th className="p-3.5 font-semibold">Storage Bundle</th>
                  <th className="p-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222735]">
                {versions.map((v: any) => {
                  const isCurrent = v.version === registryVersion;
                  const filesCount = v.manifest?.files?.length || 0;

                  return (
                    <tr key={v.id} className="hover:bg-[#0B0D11]/50 transition">
                      <td className="p-3.5 font-mono font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span>v{v.version}</span>
                          {isCurrent && (
                            <Chip size="sm" variant="flat" color="success" className="text-[10px] h-5">
                              Active
                            </Chip>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-zinc-400">
                        {new Date(v.created_at).toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span className="flex items-center gap-1.5 font-mono text-zinc-300">
                          <IconFileCode size={14} className="text-zinc-500" stroke={1.5} />
                          <span>{filesCount} declared files</span>
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-zinc-400 text-[11px] truncate max-w-xs">
                        {v.bundle_url ? (
                          <a
                            href={v.bundle_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#0F62FE] hover:underline flex items-center gap-1"
                          >
                            <IconDownload size={13} stroke={1.5} />
                            <span>Download .tar.gz</span>
                          </a>
                        ) : (
                          <span className="text-zinc-600">Pending</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <Button
                          as="a"
                          href={v.bundle_url || "#"}
                          target="_blank"
                          rel="noreferrer"
                          size="sm"
                          variant="light"
                          className="text-xs text-zinc-300 hover:text-white"
                          startContent={<IconDownload size={14} stroke={1.5} />}
                        >
                          Archive
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
