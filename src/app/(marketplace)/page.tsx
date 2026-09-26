"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Input,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Chip,
  Snippet,
  Avatar,
  Spinner,
} from "@nextui-org/react";
import {
  IconSearch,
  IconDownload,
  IconCheck,
  IconBox,
  IconX,
  IconFilter,
  IconStar,
  IconGitFork,
} from "@tabler/icons-react";
import { CATALOG_CATEGORIES } from "@/components/MarketplaceSidebar";

interface PackageItem {
  id: string;
  name: string;
  display_name: string;
  description: string;
  repo_url: string;
  latest_version: string;
  category: string;
  tags: string[];
  downloads: number;
  stars?: number;
  forks?: number;
  is_verified: boolean;
  publishers: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

function MarketplaceCatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedCategory = searchParams.get("category") || "all";

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (selectedCategory && selectedCategory !== "all") {
        params.set("type", selectedCategory);
      }

      const res = await fetch(`/api/v1/packages?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setPackages(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load packages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPackages();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const activeCategoryObj = CATALOG_CATEGORIES.find((c) => c.key === selectedCategory);

  const clearCategory = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    const q = params.toString();
    router.push(q ? `/?${q}` : "/");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Catalog Search & Active Filter Bar */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <Input
            isClearable
            size="md"
            placeholder="Search agents, skills, MCP servers, tools, or keywords..."
            startContent={<IconSearch size={18} className="text-zinc-400" stroke={1.5} />}
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="w-full sm:max-w-xl bg-[#161922]"
            classNames={{
              inputWrapper: "bg-[#161922] border border-[#222735] hover:border-[#0F62FE] focus-within:!border-[#0F62FE]",
              input: "text-white placeholder:text-zinc-500 text-sm",
            }}
          />

          {/* Active Filter Indicator */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {selectedCategory !== "all" && activeCategoryObj ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0F62FE]/10 border border-[#0F62FE]/30 text-xs text-[#0F62FE]">
                <IconFilter size={14} stroke={2} />
                <span>CATEGORY: <strong>{activeCategoryObj.label}</strong></span>
                <button
                  onClick={clearCategory}
                  className="hover:text-white transition ml-1"
                  title="Clear category filter"
                >
                  <IconX size={14} stroke={2} />
                </button>
              </div>
            ) : (
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                ALL EXTENSIONS
              </span>
            )}
          </div>
        </div>

        {/* Package Grid - 3 columns on desktop */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-zinc-400">
            <Spinner color="primary" size="lg" />
            <span className="text-sm">Fetching verified packages from registry...</span>
          </div>
        ) : packages.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-center border border-dashed border-[#222735] rounded-3xl p-8">
            <div className="w-12 h-12 rounded-2xl bg-[#161922] flex items-center justify-center text-zinc-500">
              <IconBox size={24} stroke={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-white">No packages found</h3>
            <p className="text-sm text-zinc-400 max-w-sm">
              {selectedCategory !== "all"
                ? `No packages found in category '${activeCategoryObj?.label || selectedCategory}'. Try clearing the filter or publish one!`
                : "We couldn't find any packages matching your query. Be the first to publish one!"}
            </p>
            <div className="flex items-center gap-3 mt-2">
              {selectedCategory !== "all" && (
                <Button size="sm" variant="flat" onPress={clearCategory}>
                  Show All Packages
                </Button>
              )}
              <Button
                as={Link}
                href="/publish"
                size="sm"
                color="primary"
              >
                Publish Package
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className="bg-[#161922] border border-[#222735] hover:border-[#0F62FE]/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 group flex flex-col justify-between"
              >
                <CardHeader className="flex items-start justify-between gap-4 p-5 pb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={pkg.publishers?.avatar_url}
                      name={pkg.publishers?.username || "Dev"}
                      size="sm"
                      className="border border-[#222735] shrink-0"
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/packages/${pkg.name}`}
                        className="font-bold text-base text-white group-hover:text-[#0F62FE] transition flex items-center gap-1.5 truncate"
                      >
                        <span className="truncate">{pkg.display_name}</span>
                        {pkg.is_verified && (
                          <IconCheck size={16} className="text-[#0F62FE] shrink-0" stroke={2} />
                        )}
                      </Link>
                      <div className="text-xs text-zinc-400 flex items-center gap-1.5 truncate">
                        <span>@{pkg.publishers?.username || "community"}</span>
                        <span>&bull;</span>
                        <span className="font-mono text-zinc-300">v{pkg.latest_version}</span>
                      </div>
                    </div>
                  </div>

                  <Chip
                    size="sm"
                    variant="flat"
                    className="uppercase text-[10px] font-bold bg-[#0F62FE]/10 text-[#0F62FE] border border-[#0F62FE]/20 shrink-0"
                  >
                    {pkg.category}
                  </Chip>
                </CardHeader>

                <CardBody className="px-5 py-3 text-sm text-zinc-400 line-clamp-3">
                  {pkg.description}
                </CardBody>

                <CardFooter className="flex flex-col gap-3 p-5 pt-2 border-t border-[#222735]/60 bg-[#0B0D11]/30">
                  <div className="w-full flex items-center justify-between text-xs text-zinc-400">
                    {/* Real GitHub Stars & Forks (No placeholder downloads) */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-amber-400" title="GitHub Stars">
                        <IconStar size={14} className="fill-amber-400/20" stroke={1.8} />
                        <span className="font-semibold text-zinc-300">{pkg.stars ?? 0}</span>
                      </div>

                      <div className="flex items-center gap-1 text-zinc-400" title="GitHub Forks">
                        <IconGitFork size={14} stroke={1.8} />
                        <span className="text-zinc-400">{pkg.forks ?? 0}</span>
                      </div>

                      {pkg.downloads > 0 && (
                        <div className="flex items-center gap-1 text-zinc-400" title="Total Downloads">
                          <IconDownload size={13} stroke={1.5} />
                          <span>{pkg.downloads}</span>
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/packages/${pkg.name}`}
                      className="text-[#0F62FE] hover:underline font-semibold text-xs"
                    >
                      Details &rarr;
                    </Link>
                  </div>

                  <Snippet
                    size="sm"
                    symbol=""
                    className="w-full bg-[#0B0D11] text-zinc-300 font-mono text-xs border border-[#222735]"
                  >
                    {`@marketplace add ${pkg.name}`}
                  </Snippet>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function MarketplaceHomePage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex justify-center items-center">
          <Spinner size="lg" color="primary" />
        </div>
      }
    >
      <MarketplaceCatalogContent />
    </Suspense>
  );
}
