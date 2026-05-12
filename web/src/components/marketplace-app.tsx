"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Filter,
  Gauge,
  Handshake,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  WalletCards,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { encodePacked, keccak256, parseEther, toBytes } from "viem";
import { useWriteContract } from "wagmi";
import {
  buyerIntents,
  capabilityAssets,
  initialSubscriptions,
  matchSignals,
  navItems,
  opportunityTemplates,
} from "@/lib/data";
import { opcMarketAbi, opcMarketAddress } from "@/lib/contract";
import type {
  CapabilityAsset,
  MatchSignal,
  OpportunityTemplate,
  Subscription,
  SubscriptionStatus,
} from "@/lib/types";

const statusStyles: Record<SubscriptionStatus, string> = {
  Preview: "border-sky-200 bg-sky-50 text-sky-700",
  Subscribed: "border-amber-200 bg-amber-50 text-amber-700",
  Feedback: "border-violet-200 bg-violet-50 text-violet-700",
  Released: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const typeStyles: Record<CapabilityAsset["type"], string> = {
  "Document / Report": "bg-emerald-100 text-emerald-800",
  "Template / Methodology": "bg-cyan-100 text-cyan-800",
  "Dataset / Annotation": "bg-amber-100 text-amber-900",
};

const demoBeats = [
  "0:00 问题：OPC 知识资产难以被信任、比较和持续订阅",
  "0:45 实机：资产页预览 + Verified OPC + 版本哈希",
  "2:00 实机：买家用 MON 订阅，首期款进入托管",
  "3:20 技术：Monad 记录资产、版本、订阅和反馈事件",
  "4:20 商业：订阅抽成 + 验证准入 + 声誉层",
];

const submissionItems = [
  "MOJO 项目已创建",
  "查看项目 / 查看源码链接可用",
  "公开 GitHub",
  "公网前端预览",
  "Monad testnet 合约",
  "Logo 与预览图",
];

export default function MarketplaceApp() {
  const [activeNav, setActiveNav] = useState("discover");
  const [query, setQuery] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState(1);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(
    opportunityTemplates[0].id,
  );
  const [subscriptions, setSubscriptions] =
    useState<Subscription[]>(initialSubscriptions);
  const [isCreating, setIsCreating] = useState(false);
  const createLockRef = useRef(false);
  const { writeContract, isPending, data: txHash } = useWriteContract();

  const selectedAsset =
    capabilityAssets.find((asset) => asset.id === selectedAssetId) ??
    capabilityAssets[0];

  const filteredAssets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return capabilityAssets;

    return capabilityAssets.filter((asset) => {
      const haystack = [
        asset.title,
        asset.seller,
        asset.summary,
        asset.preview,
        asset.tags.join(" "),
        asset.type,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [query]);

  const matchingIntents = buyerIntents.filter(
    (intent) => intent.matchAssetId === selectedAsset.id,
  );
  const selectedOpportunity =
    opportunityTemplates.find(
      (opportunity) => opportunity.id === selectedOpportunityId,
    ) ?? opportunityTemplates[0];
  const selectedSignal =
    matchSignals.find((signal) => signal.assetId === selectedAsset.id) ??
    matchSignals[0];

  const createLocalSubscription = (asset: CapabilityAsset) => {
    const nextSubscription: Subscription = {
      id: `S-${2402 + subscriptions.length}`,
      assetId: asset.id,
      title: asset.title,
      buyer: "Connected buyer",
      seller: asset.seller,
      value: asset.price,
      status: "Subscribed",
      evidence: "access-hash: local preview",
    };

    setSubscriptions((currentSubscriptions) => [
      nextSubscription,
      ...currentSubscriptions,
    ]);
  };

  const subscribeToAsset = (asset: CapabilityAsset) => {
    if (createLockRef.current) return;

    createLockRef.current = true;
    setIsCreating(true);

    if (opcMarketAddress) {
      const accessHash = keccak256(
        toBytes(
          `${selectedOpportunity.id}:${asset.id}:${asset.currentVersion}:${asset.title}`,
        ),
      );
      writeContract({
        abi: opcMarketAbi,
        address: opcMarketAddress,
        functionName: "subscribe",
        args: [BigInt(asset.id), accessHash, "ipfs://demo-access-request"],
        value: parseEther(asset.price.replace(" MON", "")),
        gas: 170000n,
      });
    }

    createLocalSubscription(asset);
    window.setTimeout(() => {
      createLockRef.current = false;
      setIsCreating(false);
    }, 500);
  };

  const submitFeedback = (subscriptionId: string) => {
    setSubscriptions((currentSubscriptions) =>
      currentSubscriptions.map((subscription) =>
        subscription.id === subscriptionId
          ? {
              ...subscription,
              status: "Feedback",
              evidence: "feedback-hash: local preview",
            }
          : subscription,
      ),
    );
  };

  const releaseSubscription = (subscriptionId: string) => {
    setSubscriptions((currentSubscriptions) =>
      currentSubscriptions.map((subscription) =>
        subscription.id === subscriptionId
          ? { ...subscription, status: "Released" }
          : subscription,
      ),
    );
  };

  const versionHash = keccak256(
    encodePacked(
      ["uint256", "string", "string"],
      [BigInt(selectedAsset.id), selectedAsset.currentVersion, selectedAsset.title],
    ),
  );
  const opportunityHash = keccak256(
    encodePacked(
      ["string", "uint256", "string"],
      [selectedOpportunity.id, BigInt(selectedAsset.id), selectedSignal.intentSummary],
    ),
  );

  const selectOpportunity = (opportunity: OpportunityTemplate) => {
    setSelectedOpportunityId(opportunity.id);
    setSelectedAssetId(opportunity.recommendedAssetId);
  };

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] gap-5 px-4 py-4 lg:px-6">
        <aside className="hidden w-[88px] shrink-0 flex-col items-center rounded-[28px] border border-slate-200 bg-white/90 py-5 shadow-sm lg:flex">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <Boxes size={22} />
          </div>
          <nav className="mt-8 flex flex-col gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;

              return (
                <button
                  aria-label={item.label}
                  className={`flex size-12 items-center justify-center rounded-2xl border transition ${
                    isActive
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                  }`}
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  type="button"
                >
                  <Icon size={20} />
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-5">
          <header className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[#103c35] text-white lg:hidden">
                  <Boxes size={20} />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-normal text-slate-950 md:text-3xl">
                    OPC KnoVault
                  </h1>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                    Verified OPC 发布知识资产，买家订阅内容访问权，Monad 记录资产、版本、订阅和声誉事件。
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                6:30 PM 提交截止
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                5 min 实机演示
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                Monad Testnet · Chain ID 10143
              </div>
              <ConnectButton />
            </div>
          </header>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="flex min-w-0 flex-col gap-5">
              <section className="grid gap-4 md:grid-cols-4">
                <MetricCard icon={ShieldCheck} label="Verified OPCs" value="32" tone="green" />
                <MetricCard icon={Handshake} label="Active subs" value="91" tone="blue" />
                <MetricCard icon={Gauge} label="Trust events" value="246" tone="amber" />
                <MetricCard icon={FileCheck2} label="Refund window" value="7 days" tone="rose" />
              </section>

              <OpportunityMatchPanel
                matchSignal={selectedSignal}
                onSelectOpportunity={selectOpportunity}
                opportunityHash={opportunityHash}
                opportunities={opportunityTemplates}
                selectedAsset={selectedAsset}
                selectedOpportunity={selectedOpportunity}
              />

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold tracking-normal">知识资产发现</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      买家先比较资产页、免费预览、作者验证状态和版本哈希，再订阅当前有效版本。
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative min-w-0 flex-1 md:w-72">
                      <Search
                        aria-hidden
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <input
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="搜索报告、模板、数据集"
                        value={query}
                      />
                    </div>
                    <button
                      aria-label="筛选"
                      className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                      type="button"
                    >
                      <Filter size={18} />
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {filteredAssets.map((asset) => (
                    <AssetRow
                      asset={asset}
                      isSelected={asset.id === selectedAsset.id}
                      key={asset.id}
                      onSelect={() => setSelectedAssetId(asset.id)}
                      onSubscribe={() => subscribeToAsset(asset)}
                    />
                  ))}
                </div>
              </section>

              <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-normal">资产页预览</h2>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                      Verified OPC
                    </span>
                  </div>
                  <div className="mt-4 rounded-3xl border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-950">{selectedAsset.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {selectedAsset.preview}
                    </p>
                    <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                      <InfoPill label="Version" value={selectedAsset.currentVersion} />
                      <InfoPill label="Updates" value={selectedAsset.updateFrequency} />
                      <InfoPill label="Mode" value={selectedAsset.productionMode} />
                      <InfoPill label="Access" value={selectedAsset.duration} />
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {matchingIntents.map((intent) => (
                      <button
                        className="w-full rounded-3xl border border-slate-200 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
                        key={intent.id}
                        onClick={() => setSelectedAssetId(intent.matchAssetId)}
                        type="button"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">{intent.title}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-500">{intent.need}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {intent.budget}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                          <span>{intent.buyer}</span>
                          <span>{intent.category}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-normal">订阅与声誉事件</h2>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {subscriptions.length} records
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {subscriptions.map((subscription) => (
                      <div
                        className="rounded-3xl border border-slate-200 p-4"
                        key={subscription.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              {subscription.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {subscription.buyer} → {subscription.seller}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[subscription.status]}`}
                          >
                            {subscription.status}
                          </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-slate-900">
                            {subscription.value}
                          </span>
                          {subscription.status === "Subscribed" ? (
                            <button
                              className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white"
                              onClick={() => submitFeedback(subscription.id)}
                              type="button"
                            >
                              提交反馈
                            </button>
                          ) : subscription.status === "Feedback" ? (
                            <button
                              className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white"
                              onClick={() => releaseSubscription(subscription.id)}
                              type="button"
                            >
                              平台放款
                            </button>
                          ) : (
                            <span className="truncate text-xs text-slate-500">
                              {subscription.evidence}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            <aside className="flex min-w-0 flex-col gap-5">
              <section className="rounded-[28px] border border-slate-200 bg-[#103c35] p-5 text-white shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-emerald-100">Selected asset</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-normal">
                      {selectedAsset.title}
                    </h2>
                  </div>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                    {selectedAsset.match}% fit
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-emerald-50">{selectedAsset.summary}</p>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <ProofTile label="Price" value={selectedAsset.price} />
                  <ProofTile label="Access" value={selectedAsset.duration} />
                  <ProofTile label="Rating" value={selectedAsset.rating.toFixed(1)} />
                </div>

                <button
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold text-[#103c35] transition hover:bg-emerald-50 disabled:opacity-70"
                  disabled={isCreating || isPending}
                  onClick={() => subscribeToAsset(selectedAsset)}
                  type="button"
                >
                  <LockKeyhole size={18} />
                  {isCreating || isPending ? "创建订阅中" : "订阅当前版本"}
                </button>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold tracking-normal">Monad 可信事件层</h2>
                <div className="mt-4 space-y-3">
                  <ChainItem
                    icon={WalletCards}
                    label="Network"
                    value="Monad Testnet / 10143"
                  />
                  <ChainItem
                    icon={LockKeyhole}
                    label="Trust contract"
                    value={opcMarketAddress ? shortAddress(opcMarketAddress) : "待部署"}
                  />
                  <ChainItem icon={Clock3} label="Gas policy" value="固定交易显式 gas limit" />
                  <ChainItem icon={CheckCircle2} label="Version hash" value={shortAddress(versionHash)} />
                </div>
                {txHash ? (
                  <a
                    className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    href={`https://testnet.monadexplorer.com/tx/${txHash}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    查看交易
                    <ArrowUpRight size={17} />
                  </a>
                ) : null}
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-amber-500" size={19} />
                  <h2 className="text-lg font-semibold tracking-normal">5分钟演示顺序</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {demoBeats.map((beat) => (
                    <ReadinessItem key={beat} text={beat} />
                  ))}
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold tracking-normal">MOJO 提交包</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    6:30 PM
                  </span>
                </div>
                <div className="mt-4 grid gap-2">
                  {submissionItems.map((item) => (
                    <ReadinessItem key={item} text={item} />
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function OpportunityMatchPanel({
  matchSignal,
  onSelectOpportunity,
  opportunities,
  opportunityHash,
  selectedAsset,
  selectedOpportunity,
}: {
  matchSignal: MatchSignal;
  onSelectOpportunity: (opportunity: OpportunityTemplate) => void;
  opportunities: OpportunityTemplate[];
  opportunityHash: string;
  selectedAsset: CapabilityAsset;
  selectedOpportunity: OpportunityTemplate;
}) {
  return (
    <section className="grid gap-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
            <BrainCircuit size={19} />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-normal">AI 需求匹配台</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              从 MONSKILLS 的机会模板进入，Agent 先解释匹配，再把买家导向可订阅资产。
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {opportunities.map((opportunity) => {
            const isSelected = opportunity.id === selectedOpportunity.id;

            return (
              <button
                className={`rounded-3xl border p-4 text-left transition ${
                  isSelected
                    ? "border-slate-950 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
                key={opportunity.id}
                onClick={() => onSelectOpportunity(opportunity)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {opportunity.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {opportunity.summary}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {opportunity.budget}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {opportunity.capabilities.map((capability) => (
                    <span
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500"
                      key={capability}
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-w-0 rounded-3xl border border-slate-200 bg-[#f7f8f4] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
              Agent match result
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-normal text-slate-950">
              {selectedAsset.title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {selectedOpportunity.buyer} · {selectedOpportunity.market} ·{" "}
              {selectedOpportunity.cycle}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950 px-4 py-3 text-right text-white">
            <p className="text-xs font-medium text-slate-300">Fit score</p>
            <p className="text-2xl font-semibold">{matchSignal.score}%</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <SignalRow icon={Sparkles} label="推荐理由" value={matchSignal.reason} />
          <SignalRow icon={ShieldCheck} label="可信依据" value={matchSignal.trust} />
          <SignalRow icon={AlertTriangle} label="风险提示" value={matchSignal.risk} />
          <SignalRow icon={CheckCircle2} label="合作建议" value={matchSignal.suggestion} />
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">Intent summary hash</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                {shortAddress(opportunityHash)}
              </p>
            </div>
            <button
              className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-xs font-semibold text-white transition hover:bg-slate-800"
              onClick={() => onSelectOpportunity(selectedOpportunity)}
              type="button"
            >
              锁定推荐
              <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function AssetRow({
  asset,
  isSelected,
  onSelect,
  onSubscribe,
}: {
  asset: CapabilityAsset;
  isSelected: boolean;
  onSelect: () => void;
  onSubscribe: () => void;
}) {
  return (
    <article
      className={`grid gap-4 rounded-3xl border p-4 transition md:grid-cols-[minmax(0,1fr)_170px] ${
        isSelected ? "border-slate-950 bg-slate-50" : "border-slate-200 bg-white"
      }`}
    >
      <button className="min-w-0 text-left" onClick={onSelect} type="button">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${typeStyles[asset.type]}`}>
            {asset.type}
          </span>
          <span className="flex items-center gap-1 rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
            <ShieldCheck size={13} />
            Verified OPC
          </span>
          {asset.tags.map((tag) => (
            <span
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
        <h3 className="mt-3 text-base font-semibold tracking-normal text-slate-950">
          {asset.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{asset.summary}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          <span>{asset.seller}</span>
          <span>{asset.handle}</span>
          <span>{asset.proof}</span>
        </div>
      </button>
      <div className="flex items-center justify-between gap-4 md:flex-col md:items-end">
        <div className="text-right">
          <p className="text-lg font-semibold text-slate-950">{asset.price}</p>
          <p className="text-xs text-slate-500">{asset.duration} access</p>
          <p className="mt-1 flex items-center justify-end gap-1 text-xs text-slate-500">
            <Star className="text-amber-500" size={13} />
            {asset.rating.toFixed(1)} / {asset.subscriptions} subs
          </p>
        </div>
        <button
          className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          onClick={onSubscribe}
          type="button"
        >
          Subscribe
          <ArrowUpRight size={17} />
        </button>
      </div>
    </article>
  );
}

function MetricCard({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: typeof ShieldCheck;
  label: string;
  tone: "green" | "blue" | "amber" | "rose";
  value: string;
}) {
  const tones = {
    green: "bg-emerald-100 text-emerald-700",
    blue: "bg-cyan-100 text-cyan-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
  };

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`flex size-10 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon size={19} />
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-normal text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function ProofTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-3">
      <p className="text-xs font-medium text-emerald-100">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SignalRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-sm leading-6 text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function ChainItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof WalletCards;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function ReadinessItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 px-3 py-3 text-sm leading-6 text-slate-600">
      <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={17} />
      <span>{text}</span>
    </div>
  );
}

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
