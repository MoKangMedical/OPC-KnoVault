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
  UploadCloud,
  WalletCards,
  Workflow,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { encodePacked, keccak256, parseEther, toBytes } from "viem";
import {
  useAccount,
  useChainId,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { opcMarketAbi, opcMarketAddress } from "@/lib/contract";
import {
  buyerIntents,
  capabilityAssets,
  initialSubscriptions,
  matchSignals,
  navItems,
  opportunityTemplates,
} from "@/lib/data";
import type {
  CapabilityAsset,
  MatchSignal,
  OpportunityTemplate,
  Subscription,
  SubscriptionStatus,
} from "@/lib/types";

const monadTestnetChainId = 10143;

const statusStyles: Record<SubscriptionStatus, string> = {
  Preview: "border-sky-400/25 bg-sky-400/10 text-sky-200",
  Subscribed: "border-[#e2b64f]/35 bg-[#e2b64f]/10 text-[#f5d98a]",
  Feedback: "border-violet-400/25 bg-violet-400/10 text-violet-200",
  Released: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
};

const typeStyles: Record<CapabilityAsset["type"], string> = {
  "Document / Report": "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  "Template / Methodology": "border-[#e2b64f]/35 bg-[#e2b64f]/10 text-[#f5d98a]",
  "Dataset / Annotation": "border-blue-300/25 bg-blue-300/10 text-blue-200",
};

const ecosystemLinks = [
  { label: "创业助手", href: "https://opcplatform.cn/service.html" },
  { label: "平台", href: "https://opcplatform.cn/platform.html" },
  { label: "揭榜挂帅", href: "https://opcplatform.cn/government.html" },
  { label: "超级个体", href: "https://opcplatform.cn/superagent.html" },
  { label: "学院", href: "https://opcplatform.cn/academy.html" },
];

const ledgerRows = [
  "AssetRegistered: OPC 资产、生产方式、价格和订阅周期",
  "AssetVersionPublished: 每次知识库更新写入 version hash",
  "SubscriptionCreated: 买家支付 MON，首期款进入托管",
  "FeedbackSubmitted: 订阅者反馈形成声誉资产",
  "FirstTermApproved: 买家确认后平台按费率结算",
];

const participantEntrances: {
  title: string;
  kicker: string;
  description: string;
  action: string;
  nav: string;
  icon: LucideIcon;
  bullets: string[];
}[] = [
  {
    title: "我是需求方",
    kicker: "Buyer entry",
    description:
      "从揭榜、创业助手或具体采购任务进入，先让 AI 解释匹配，再用 MON 订阅可信资产。",
    action: "找可交易资产",
    nav: "discover",
    icon: Search,
    bullets: ["输入需求或选择机会模板", "查看免费预览、版本和 OPC 验证", "MetaMask 支付，订阅当前版本"],
  },
  {
    title: "我是 OPC 供给方",
    kicker: "Seller entry",
    description:
      "把技能、方法论、知识库、数据集包装成标准资产，形成可被发现、订阅和复购的商品。",
    action: "发布我的资产",
    nav: "assets",
    icon: UploadCloud,
    bullets: ["声明资产类型、价格和访问周期", "写入版本 hash 和生产方式", "订阅、反馈和评分沉淀成声誉"],
  },
  {
    title: "链上可信交易",
    kicker: "Settlement layer",
    description:
      "Monad 记录资产版本、订阅、反馈与首期托管，让交易双方都有可验证的履约证据。",
    action: "查看可信账本",
    nav: "buyers",
    icon: WalletCards,
    bullets: ["MON 支付进入订阅合约", "访问请求和版本证据可追踪", "反馈确认后形成结算和声誉事件"],
  },
];

const transactionFlow = [
  {
    step: "01",
    title: "需求进入",
    text: "买家选择机会模板或搜索资产，系统生成 intent hash 作为匹配证据。",
  },
  {
    step: "02",
    title: "AI 匹配",
    text: "对比资产标签、版本、生产方式、历史订阅和风险提示，推荐最适合的 OPC 资产。",
  },
  {
    step: "03",
    title: "订阅托管",
    text: "买家用 MetaMask 在 Monad Testnet 支付 MON，合约创建订阅并记录访问请求。",
  },
  {
    step: "04",
    title: "交付声誉",
    text: "订阅期内获取内容更新；反馈、确认和放款事件沉淀为供给方可信声誉。",
  },
];

const productCards = [
  {
    title: "主产品取舍",
    body: "Hackathon 版本聚焦 OPC Trust Market：Verified OPC 发布知识资产，买家用 MON 订阅。OPC Match 作为后续上游发现层。",
    icon: ShieldCheck,
  },
  {
    title: "交易对象",
    body: "v1 只交易 Knowledge Asset Subscription，不交易招聘岗位、泛技能或执行型外包。",
    icon: Boxes,
  },
  {
    title: "买家获得",
    body: "订阅期内的 Usage Right、Content Access、Update Access，以及永久可追溯的 Purchase Record。",
    icon: LockKeyhole,
  },
  {
    title: "Monad 角色",
    body: "Monad 记录资产、版本、订阅、反馈、托管放款和退款裁决；正文内容仍保存在链下。",
    icon: WalletCards,
  },
];

const assetStandards = [
  "Clear Promise",
  "Preview",
  "Version hash",
  "Verified OPC",
  "MON price",
  "Reputation",
];

const demoLoop = [
  "Verified OPC 发布 AI 出海增长审计报告包",
  "资产页展示摘要、样例、版本、生产方式和声誉",
  "买家连接钱包，用 MON 订阅当前版本",
  "OPCMarket 记录 subscription 和 access hash",
  "买家提交结构化反馈",
  "平台放款，2.5% 平台费可解释",
];

const demoBeats = [
  "0:00 需求方从 OPC Platform 进入 KnoVault",
  "0:45 AI 匹配机会模板，解释资产适配度和风险",
  "2:00 资产页展示预览、版本 hash、OPC 验证和订阅价格",
  "3:20 MetaMask 支付 MON，Monad 记录订阅托管事件",
  "4:20 反馈与放款形成可复用的 OPC 声誉层",
];

const submissionItems = [
  "公开 GitHub 与源码说明",
  "Monad Testnet 合约地址",
  "可演示的 MetaMask 支付路径",
  "OPC Platform 生态入口和品牌一致性",
  "5 分钟 demo script 与提交材料",
];

export default function MarketplaceApp() {
  const [activeNav, setActiveNav] = useState("home");
  const [query, setQuery] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState(1);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(
    opportunityTemplates[0].id,
  );
  const [subscriptions, setSubscriptions] =
    useState<Subscription[]>(initialSubscriptions);
  const [pendingAsset, setPendingAsset] = useState<CapabilityAsset | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    "连接 MetaMask 后可用 Monad Testnet 订阅当前版本。",
  );
  const createLockRef = useRef(false);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContract, isPending, data: txHash, error } = useWriteContract();
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({ hash: txHash });

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

  const isWrongNetwork = isConnected && chainId !== monadTestnetChainId;
  const canPay = Boolean(isConnected && !isWrongNetwork && opcMarketAddress);
  const transactionBusy = isPending || isConfirming;

  useEffect(() => {
    if (!isConfirmed || !receipt?.transactionHash || !pendingAsset) return;

    const transactionHash = receipt.transactionHash;
    queueMicrotask(() => {
      setSubscriptions((currentSubscriptions) => {
        if (
          currentSubscriptions.some((subscription) =>
            subscription.evidence.includes(transactionHash),
          )
        ) {
          return currentSubscriptions;
        }

        const nextSubscription: Subscription = {
          id: `S-${2402 + currentSubscriptions.length}`,
          assetId: pendingAsset.id,
          title: pendingAsset.title,
          buyer: address ? shortAddress(address) : "Connected buyer",
          seller: pendingAsset.seller,
          value: pendingAsset.price,
          status: "Subscribed",
          evidence: `tx:${shortAddress(transactionHash)}`,
        };

        return [nextSubscription, ...currentSubscriptions];
      });

      setStatusMessage(`订阅已上链：${shortAddress(transactionHash)}`);
      setActiveNav("subscriptions");
      setPendingAsset(null);
      createLockRef.current = false;
    });
  }, [address, isConfirmed, pendingAsset, receipt?.transactionHash]);

  useEffect(() => {
    if (!error) return;
    queueMicrotask(() => {
      setStatusMessage(
        `交易未完成：${"shortMessage" in error ? error.shortMessage : error.message}`,
      );
      setPendingAsset(null);
      createLockRef.current = false;
    });
  }, [error]);

  const selectOpportunity = (opportunity: OpportunityTemplate) => {
    setSelectedOpportunityId(opportunity.id);
    setSelectedAssetId(opportunity.recommendedAssetId);
    setActiveNav("discover");
  };

  const subscribeToAsset = (asset: CapabilityAsset) => {
    if (createLockRef.current || transactionBusy) return;
    if (!opcMarketAddress) {
      setStatusMessage("缺少 NEXT_PUBLIC_OPC_MARKET_ADDRESS，无法发起真实支付。");
      return;
    }
    if (!isConnected) {
      setStatusMessage("请先连接 MetaMask。");
      return;
    }
    if (isWrongNetwork) {
      setStatusMessage("请切换到 Monad Testnet，Chain ID 10143。");
      return;
    }

    createLockRef.current = true;
    setPendingAsset(asset);
    setStatusMessage(`等待钱包确认：订阅 ${asset.title}，支付 ${asset.price}。`);

    const accessHash = keccak256(
      toBytes(
        `${selectedOpportunity.id}:${asset.id}:${asset.currentVersion}:${asset.title}`,
      ),
    );

    writeContract({
      abi: opcMarketAbi,
      address: opcMarketAddress,
      functionName: "subscribe",
      args: [BigInt(asset.id), accessHash, "ipfs://opc-knovault/access-request"],
      value: parseEther(asset.price.replace(" MON", "")),
    });
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

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#09090b] text-[#fafafa]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(226,182,79,0.18),transparent_42%),linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[length:auto,72px_72px,72px_72px]" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09090b]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between gap-4 px-4 md:px-6">
          <a
            className="flex items-center gap-3 text-sm font-extrabold text-white"
            href="https://opcplatform.cn/index.html"
            rel="noreferrer"
            target="_blank"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#e2b64f,#6b7db3)] text-xs text-white shadow-[0_0_24px_rgba(226,182,79,0.25)]">
              ◆
            </span>
            <span>OPC Platform</span>
            <span className="hidden text-[#71717a] md:inline">/</span>
            <span className="hidden text-[#f5d98a] md:inline">KnoVault</span>
          </a>

          <nav className="hidden items-center gap-1 lg:flex">
            {ecosystemLinks.map((link) => (
              <a
                className="rounded-lg px-3 py-2 text-xs font-medium text-[#a1a1aa] transition hover:bg-white/[0.04] hover:text-white"
                href={link.href}
                key={link.href}
                rel="noreferrer"
                target="_blank"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-lg border border-[#e2b64f]/25 bg-[#e2b64f]/10 px-3 py-2 text-xs font-semibold text-[#f5d98a] sm:inline">
              Monad Testnet · 10143
            </span>
            <ConnectButton />
          </div>
        </div>
      </header>

      <div className="relative mx-auto grid w-full max-w-[1360px] gap-5 px-4 py-5 lg:grid-cols-[86px_minmax(0,1fr)] lg:px-6">
        <aside className="hidden flex-col items-center rounded-2xl border border-white/10 bg-[#0f0f13]/80 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] lg:flex">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#e2b64f] text-[#09090b]">
            <Boxes size={22} />
          </div>
          <nav className="mt-8 flex flex-col gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;

              return (
                <button
                  aria-label={item.label}
                  className={`group flex size-12 items-center justify-center rounded-2xl border transition ${
                    isActive
                      ? "border-[#e2b64f]/50 bg-[#e2b64f] text-[#09090b]"
                      : "border-transparent text-[#71717a] hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                  }`}
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  title={item.label}
                  type="button"
                >
                  <Icon size={20} />
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0">
          {activeNav === "home" ? (
            <ProductShowcase onSelectNav={setActiveNav} />
          ) : (
            <>
              <Hero
                activeNav={activeNav}
                canPay={canPay}
                chainId={chainId}
                isConnected={isConnected}
                isWrongNetwork={isWrongNetwork}
                onSelectNav={setActiveNav}
                statusMessage={statusMessage}
              />

              <TradingEntrances onSelectNav={setActiveNav} />

              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
                <div className="min-w-0 space-y-5">
                  {activeNav === "discover" ? (
                    <>
                      <section className="grid gap-4 md:grid-cols-4">
                        <MetricCard icon={ShieldCheck} label="Verified OPCs" value="32" />
                        <MetricCard icon={Handshake} label="Active subs" value="91" />
                        <MetricCard icon={Gauge} label="Trust events" value="246" />
                        <MetricCard icon={FileCheck2} label="Escrow fee" value="2.5%" />
                      </section>

                      <TransactionFlow />

                      <OpportunityMatchPanel
                        matchSignal={selectedSignal}
                        onSelectOpportunity={selectOpportunity}
                        opportunityHash={opportunityHash}
                        opportunities={opportunityTemplates}
                        selectedAsset={selectedAsset}
                        selectedOpportunity={selectedOpportunity}
                      />

                      <AssetMarket
                        filteredAssets={filteredAssets}
                        query={query}
                        selectedAsset={selectedAsset}
                        setQuery={setQuery}
                        setSelectedAssetId={setSelectedAssetId}
                        subscribeToAsset={subscribeToAsset}
                        transactionBusy={transactionBusy}
                      />
                    </>
                  ) : null}

                  {activeNav === "assets" ? (
                    <PublishPanel selectedAsset={selectedAsset} versionHash={versionHash} />
                  ) : null}

                  {activeNav === "subscriptions" ? (
                    <SubscriptionsPanel
                      onRelease={releaseSubscription}
                      onSubmitFeedback={submitFeedback}
                      subscriptions={subscriptions}
                      txHash={txHash}
                    />
                  ) : null}

                  {activeNav === "buyers" ? (
                    <LedgerPanel
                      opportunityHash={opportunityHash}
                      selectedSignal={selectedSignal}
                      txHash={txHash}
                      versionHash={versionHash}
                    />
                  ) : null}

                  <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
                    <AssetPreview
                      matchingIntents={matchingIntents}
                      selectedAsset={selectedAsset}
                      setSelectedAssetId={setSelectedAssetId}
                    />
                    <SubscriptionsPanel
                      compact
                      onRelease={releaseSubscription}
                      onSubmitFeedback={submitFeedback}
                      subscriptions={subscriptions.slice(0, 3)}
                      txHash={txHash}
                    />
                  </section>
                </div>

                <RightRail
                  isWrongNetwork={isWrongNetwork}
                  selectedAsset={selectedAsset}
                  statusMessage={statusMessage}
                  subscribeToAsset={subscribeToAsset}
                  transactionBusy={transactionBusy}
                  txHash={txHash}
                  versionHash={versionHash}
                />
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function ProductShowcase({
  onSelectNav,
}: {
  onSelectNav: (id: string) => void;
}) {
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f13]/85 shadow-[0_28px_80px_rgba(0,0,0,0.35)]">
        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-7">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e2b64f]/20 bg-[#e2b64f]/10 px-3 py-1.5 text-xs font-semibold text-[#f5d98a]">
              <span className="size-1.5 rounded-full bg-[#e2b64f] shadow-[0_0_10px_rgba(226,182,79,0.9)]" />
              Final product model
            </div>
            <h1 className="mt-5 max-w-4xl font-serif text-[36px] font-black leading-[1.12] text-white md:text-[54px]">
              OPC KnoVault 是 AI 时代 OPC 的
              <span className="bg-[linear-gradient(135deg,#fafafa,#f5d98a,#6b7db3)] bg-clip-text text-transparent">
                可信知识资产交易层
              </span>
            </h1>
            <p className="mt-5 max-w-3xl text-[15px] leading-7 text-[#a1a1aa] md:text-base">
              个人或小团队把可复用知识、模板、方法论和数据包发布成可验证资产；买家用 MON 订阅访问权；Monad 记录资产、版本、订阅、反馈、托管放款和退款裁决。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#e2b64f] px-5 text-sm font-black text-[#09090b] transition hover:bg-[#f5d98a]"
                onClick={() => onSelectNav("discover")}
                type="button"
              >
                一键进入交易
                <ArrowUpRight size={17} />
              </button>
              <button
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 text-sm font-bold text-white transition hover:border-[#e2b64f]/40"
                onClick={() => onSelectNav("assets")}
                type="button"
              >
                发布知识资产
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e2b64f]/25 bg-[linear-gradient(145deg,rgba(226,182,79,0.16),rgba(24,24,27,0.96))] p-5">
            <p className="text-sm font-bold text-[#f5d98a]">v1 聚焦</p>
            <h2 className="mt-2 text-2xl font-black text-white">Knowledge Asset Subscription</h2>
            <p className="mt-3 text-sm leading-6 text-[#d4d4d8]">
              交易边界清楚，5 分钟内能演示付款、访问、反馈、放款和链上事件。
            </p>
            <div className="mt-5 grid gap-2">
              <ReadinessItem text="不是招聘平台，也不是外包平台" />
              <ReadinessItem text="交易的是可复用资产的访问权" />
              <ReadinessItem text="首版演示 2.5% Subscription Fee" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {productCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              className="rounded-2xl border border-white/10 bg-[#0f0f13]/85 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.24)]"
              key={card.title}
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-[#e2b64f]/15 text-[#f5d98a]">
                <Icon size={20} />
              </div>
              <h2 className="mt-4 text-lg font-black text-white">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">{card.body}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-white/10 bg-[#0f0f13]/85 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
          <h2 className="text-xl font-black text-white">可上架资产标准</h2>
          <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
            一个资产必须说明承诺、预览、版本、来源、价格和声誉；AI 生产方式作为元数据披露，不做黑箱。
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {assetStandards.map((standard) => (
              <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3" key={standard}>
                <p className="text-sm font-bold text-white">{standard}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Human-authored", "AI-assisted", "Agent-executed"].map((mode) => (
              <span
                className="rounded-lg border border-[#e2b64f]/25 bg-[#e2b64f]/10 px-3 py-1.5 text-xs font-semibold text-[#f5d98a]"
                key={mode}
              >
                {mode}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f0f13]/85 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-black text-white">黑客松最短闭环</h2>
              <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
                评委只需要看到一条真实交易线：资产发布、MON 订阅、链上记录、反馈、放款。
              </p>
            </div>
            <button
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#e2b64f] px-4 text-sm font-black text-[#09090b] transition hover:bg-[#f5d98a]"
              onClick={() => onSelectNav("discover")}
              type="button"
            >
              现在演示交易
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {demoLoop.map((item, index) => (
              <div
                className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4"
                key={item}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e2b64f] text-xs font-black text-[#09090b]">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-[#d4d4d8]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0f0f13]/85 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
          <InfoBlock
            label="资产类型"
            value="Document / Report · Template / Methodology · Dataset / Annotation Pack"
          />
          <InfoBlock
            label="买家没有买到"
            value="所有权、转售权、二次分发权、链上正确性保证、未来执行服务 SLA"
          />
          <InfoBlock
            label="链下保存"
            value="正文、预览、审核材料、完整反馈、搜索推荐和声誉聚合"
          />
        </div>
      </section>
    </div>
  );
}

function Hero({
  activeNav,
  canPay,
  chainId,
  isConnected,
  isWrongNetwork,
  onSelectNav,
  statusMessage,
}: {
  activeNav: string;
  canPay: boolean;
  chainId: number;
  isConnected: boolean;
  isWrongNetwork: boolean;
  onSelectNav: (id: string) => void;
  statusMessage: string;
}) {
  const readiness = !isConnected
    ? "连接钱包"
    : isWrongNetwork
      ? "切换 Monad Testnet"
      : canPay
        ? "可真实交易"
        : "配置合约地址";

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f13]/85 shadow-[0_28px_80px_rgba(0,0,0,0.35)]">
      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-7">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e2b64f]/20 bg-[#e2b64f]/10 px-3 py-1.5 text-xs font-semibold text-[#f5d98a]">
            <span className="size-1.5 rounded-full bg-[#e2b64f] shadow-[0_0_10px_rgba(226,182,79,0.9)]" />
            OPC Platform 可信交易子层
          </div>
          <h1 className="mt-5 max-w-4xl font-serif text-[36px] font-black leading-[1.12] text-white md:text-[52px]">
            OPC KnoVault：把一人公司的技能、知识库和数据集变成
            <span className="bg-[linear-gradient(135deg,#fafafa,#f5d98a,#6b7db3)] bg-clip-text text-transparent">
              可交易资产
            </span>
          </h1>
          <p className="mt-5 max-w-3xl text-[15px] leading-7 text-[#a1a1aa] md:text-base">
            OPC-KnoVault 是 OPC Platform 生态里的可信交易层：需求方买到可复用的报告、模板、数据集和商业能力；供给方把知识生产变成可订阅商品；Monad 负责版本、订阅、反馈和首期托管。
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="rounded-lg border border-[#e2b64f] bg-[#e2b64f] px-4 py-2 text-sm font-semibold text-[#09090b] transition hover:bg-[#f5d98a]"
              onClick={() => onSelectNav("discover")}
              type="button"
            >
              我是需求方：找资产
            </button>
            <button
              className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white transition hover:border-[#e2b64f]/40"
              onClick={() => onSelectNav("assets")}
              type="button"
            >
              我是供给方：发布资产
            </button>
            {navItems.map((item) => (
              <button
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  activeNav === item.id
                    ? "border-[#e2b64f] bg-[#e2b64f] text-[#09090b]"
                    : "border-white/10 bg-white/[0.03] text-[#a1a1aa] hover:border-[#e2b64f]/40 hover:text-white"
                }`}
                key={item.id}
                onClick={() => onSelectNav(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#18181b] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-[#71717a]">
                Trade readiness
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">{readiness}</h2>
            </div>
            <span
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                canPay
                  ? "bg-emerald-400/10 text-emerald-200"
                  : "bg-[#e2b64f]/10 text-[#f5d98a]"
              }`}
            >
              {chainId || "-"}
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-[#a1a1aa]">{statusMessage}</p>
          <div className="mt-4 grid gap-2 text-sm">
            <ReadinessLine ok={isConnected} text="MetaMask 已连接" />
            <ReadinessLine ok={!isWrongNetwork && isConnected} text="Monad Testnet / 10143" />
            <ReadinessLine ok={Boolean(opcMarketAddress)} text="OPCMarket 合约已配置" />
          </div>
        </div>
      </div>
    </section>
  );
}

function TradingEntrances({
  onSelectNav,
}: {
  onSelectNav: (id: string) => void;
}) {
  return (
    <section className="mt-5 grid gap-4 lg:grid-cols-3">
      {participantEntrances.map((entry) => {
        const Icon = entry.icon;

        return (
          <article
            className="rounded-2xl border border-white/10 bg-[#0f0f13]/85 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.24)]"
            key={entry.title}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">
                  {entry.kicker}
                </p>
                <h2 className="mt-2 text-xl font-black text-white">{entry.title}</h2>
              </div>
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#e2b64f]/15 text-[#f5d98a]">
                <Icon size={20} />
              </div>
            </div>
            <p className="mt-4 min-h-[72px] text-sm leading-6 text-[#a1a1aa]">
              {entry.description}
            </p>
            <div className="mt-4 space-y-2">
              {entry.bullets.map((bullet) => (
                <div className="flex items-start gap-2 text-sm leading-6 text-[#d4d4d8]" key={bullet}>
                  <CheckCircle2 className="mt-1 shrink-0 text-[#e2b64f]" size={15} />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
            <button
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#e2b64f]/40 bg-[#e2b64f]/10 text-sm font-bold text-[#f5d98a] transition hover:bg-[#e2b64f] hover:text-[#09090b]"
              onClick={() => onSelectNav(entry.nav)}
              type="button"
            >
              {entry.action}
              <ArrowUpRight size={16} />
            </button>
          </article>
        );
      })}
    </section>
  );
}

function TransactionFlow() {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0f0f13]/85 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e2b64f]/20 bg-[#e2b64f]/10 px-3 py-1.5 text-xs font-semibold text-[#f5d98a]">
            <Workflow size={14} />
            Transaction model
          </div>
          <h2 className="mt-3 text-xl font-black text-white">交易双方如何完成可信闭环</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#a1a1aa]">
            KnoVault 不是展示页，而是一个可购买、可发布、可结算的 OPC 资产市场。
            需求方获得可验证交付，供给方获得可复购收入，平台获得可审计交易事件。
          </p>
        </div>
        <div className="rounded-xl border border-[#e2b64f]/25 bg-[#e2b64f]/10 px-4 py-3 text-sm font-bold text-[#f5d98a]">
          支付路径已接 Monad Testnet
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {transactionFlow.map((item) => (
          <div
            className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"
            key={item.step}
          >
            <p className="text-xs font-black text-[#e2b64f]">{item.step}</p>
            <h3 className="mt-3 text-sm font-bold text-white">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
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
    <section className="grid gap-5 rounded-2xl border border-white/10 bg-[#0f0f13]/85 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#e2b64f]/15 text-[#f5d98a]">
            <BrainCircuit size={19} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">AI 需求匹配台</h2>
            <p className="mt-1 text-sm leading-6 text-[#a1a1aa]">
              从揭榜挂帅、创业助手和社区需求进入，Agent 先解释匹配，再导向可订阅资产。
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {opportunities.map((opportunity) => {
            const isSelected = opportunity.id === selectedOpportunity.id;

            return (
              <button
                className={`rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? "border-[#e2b64f]/50 bg-[#e2b64f]/10"
                    : "border-white/10 bg-white/[0.025] hover:border-[#e2b64f]/30 hover:bg-white/[0.04]"
                }`}
                key={opportunity.id}
                onClick={() => onSelectOpportunity(opportunity)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">{opportunity.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
                      {opportunity.summary}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-[#f5d98a]">
                    {opportunity.budget}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {opportunity.capabilities.map((capability) => (
                    <span
                      className="rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium text-[#a1a1aa]"
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

      <div className="min-w-0 rounded-2xl border border-white/10 bg-[#18181b] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-[#71717a]">
              Agent match result
            </p>
            <h3 className="mt-2 text-xl font-bold text-white">{selectedAsset.title}</h3>
            <p className="mt-1 text-sm leading-6 text-[#a1a1aa]">
              {selectedOpportunity.buyer} · {selectedOpportunity.market} ·{" "}
              {selectedOpportunity.cycle}
            </p>
          </div>
          <div className="rounded-xl bg-[#e2b64f] px-4 py-3 text-right text-[#09090b]">
            <p className="text-xs font-bold">Fit score</p>
            <p className="text-2xl font-black">{matchSignal.score}%</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <SignalRow icon={Sparkles} label="推荐理由" value={matchSignal.reason} />
          <SignalRow icon={ShieldCheck} label="可信依据" value={matchSignal.trust} />
          <SignalRow icon={AlertTriangle} label="风险提示" value={matchSignal.risk} />
          <SignalRow icon={CheckCircle2} label="合作建议" value={matchSignal.suggestion} />
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-[#0f0f13] px-4 py-3">
          <p className="text-xs font-medium text-[#71717a]">Intent summary hash</p>
          <p className="mt-1 truncate text-sm font-semibold text-[#f5d98a]">
            {shortAddress(opportunityHash)}
          </p>
        </div>
      </div>
    </section>
  );
}

function AssetMarket({
  filteredAssets,
  query,
  selectedAsset,
  setQuery,
  setSelectedAssetId,
  subscribeToAsset,
  transactionBusy,
}: {
  filteredAssets: CapabilityAsset[];
  query: string;
  selectedAsset: CapabilityAsset;
  setQuery: (value: string) => void;
  setSelectedAssetId: (id: number) => void;
  subscribeToAsset: (asset: CapabilityAsset) => void;
  transactionBusy: boolean;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0f0f13]/85 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">需求方交易广场</h2>
          <p className="mt-1 text-sm leading-6 text-[#a1a1aa]">
            面向买家的一站式入口：搜索需求、比较资产页、查看免费预览和版本哈希，然后用 MON 订阅当前有效版本。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1 md:w-72">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]"
              size={18}
            />
            <input
              className="h-11 w-full rounded-xl border border-white/10 bg-[#18181b] pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-[#71717a] focus:border-[#e2b64f]/60"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索报告、模板、数据集"
              suppressHydrationWarning
              value={query}
            />
          </div>
          <button
            aria-label="筛选"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-[#a1a1aa] hover:bg-white/[0.04]"
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
            transactionBusy={transactionBusy}
          />
        ))}
      </div>
    </section>
  );
}

function AssetRow({
  asset,
  isSelected,
  onSelect,
  onSubscribe,
  transactionBusy,
}: {
  asset: CapabilityAsset;
  isSelected: boolean;
  onSelect: () => void;
  onSubscribe: () => void;
  transactionBusy: boolean;
}) {
  return (
    <article
      className={`grid gap-4 rounded-2xl border p-4 transition md:grid-cols-[minmax(0,1fr)_170px] ${
        isSelected
          ? "border-[#e2b64f]/60 bg-[#e2b64f]/10"
          : "border-white/10 bg-white/[0.025] hover:border-[#e2b64f]/30"
      }`}
    >
      <button className="min-w-0 text-left" onClick={onSelect} type="button">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${typeStyles[asset.type]}`}>
            {asset.type}
          </span>
          <span className="flex items-center gap-1 rounded-lg border border-emerald-400/25 px-2.5 py-1 text-xs font-semibold text-emerald-200">
            <ShieldCheck size={13} />
            Verified OPC
          </span>
          {asset.tags.map((tag) => (
            <span
              className="rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium text-[#a1a1aa]"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
        <h3 className="mt-3 text-base font-bold text-white">{asset.title}</h3>
        <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">{asset.summary}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#71717a]">
          <span>{asset.seller}</span>
          <span>{asset.handle}</span>
          <span>{asset.proof}</span>
        </div>
      </button>
      <div className="flex items-center justify-between gap-4 md:flex-col md:items-end">
        <div className="text-right">
          <p className="text-lg font-black text-[#f5d98a]">{asset.price}</p>
          <p className="text-xs text-[#a1a1aa]">{asset.duration} access</p>
          <p className="mt-1 flex items-center justify-end gap-1 text-xs text-[#a1a1aa]">
            <Star className="text-[#e2b64f]" size={13} />
            {asset.rating.toFixed(1)} / {asset.subscriptions} subs
          </p>
        </div>
        <button
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#e2b64f] px-4 text-sm font-bold text-[#09090b] transition hover:bg-[#f5d98a] disabled:opacity-60"
          disabled={transactionBusy}
          onClick={onSubscribe}
          type="button"
        >
          MON 订阅
          <ArrowUpRight size={17} />
        </button>
      </div>
    </article>
  );
}

function PublishPanel({
  selectedAsset,
  versionHash,
}: {
  selectedAsset: CapabilityAsset;
  versionHash: string;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0f0f13]/85 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#e2b64f]/15 text-[#f5d98a]">
          <UploadCloud size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">供给方资产发布工作台</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#a1a1aa]">
            给个人或小团队的标准化上架入口：把技能、知识库、数据集或商业能力填写为资产卡，声明价格、访问周期、生产方式和版本证据。当前 demo 预置 4 个 verified OPC 资产，生产版会接入 OPC Platform 准入/KYC 后调用 verifyOPC，再允许创作者发布。
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <DraftField label="OPC 名称" value={selectedAsset.seller} />
        <DraftField label="资产类型" value={selectedAsset.type} />
        <DraftField label="当前价格" value={selectedAsset.price} />
        <DraftField label="生产方式" value={selectedAsset.productionMode} />
        <DraftField label="访问周期" value={selectedAsset.duration} />
        <DraftField label="版本 Hash" value={shortAddress(versionHash)} />
      </div>

      <div className="mt-5 rounded-2xl border border-[#e2b64f]/20 bg-[#e2b64f]/10 p-4">
        <p className="text-sm font-bold text-[#f5d98a]">可交易模式</p>
        <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
          卖方不是卖“时间”，而是卖可复用资产：报告包、模板库、数据集、方法论、BD 网络和执行 SOP。买家订阅当前版本；首期款由合约托管；买家提交反馈或确认后结算；版本、交易和声誉都成为后续匹配的可信信号。
        </p>
      </div>
    </section>
  );
}

function AssetPreview({
  matchingIntents,
  selectedAsset,
  setSelectedAssetId,
}: {
  matchingIntents: { id: number; matchAssetId: number; title: string; need: string; buyer: string; category: string; budget: string }[];
  selectedAsset: CapabilityAsset;
  setSelectedAssetId: (id: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f0f13]/85 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">资产页预览</h2>
        <span className="rounded-lg bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
          Verified OPC
        </span>
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
        <p className="text-sm font-bold text-white">{selectedAsset.title}</p>
        <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">{selectedAsset.preview}</p>
        <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
          <InfoPill label="Version" value={selectedAsset.currentVersion} />
          <InfoPill label="Updates" value={selectedAsset.updateFrequency} />
          <InfoPill label="Mode" value={selectedAsset.productionMode} />
          <InfoPill label="Access" value={selectedAsset.duration} />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {matchingIntents.map((intent) => (
          <button
            className="w-full rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-left transition hover:border-[#e2b64f]/30"
            key={intent.id}
            onClick={() => setSelectedAssetId(intent.matchAssetId)}
            type="button"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">{intent.title}</p>
                <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">{intent.need}</p>
              </div>
              <span className="shrink-0 rounded-lg bg-white/[0.04] px-3 py-1 text-xs font-semibold text-[#f5d98a]">
                {intent.budget}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-[#71717a]">
              <span>{intent.buyer}</span>
              <span>{intent.category}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SubscriptionsPanel({
  compact,
  onRelease,
  onSubmitFeedback,
  subscriptions,
  txHash,
}: {
  compact?: boolean;
  onRelease: (subscriptionId: string) => void;
  onSubmitFeedback: (subscriptionId: string) => void;
  subscriptions: Subscription[];
  txHash?: string;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0f0f13]/85 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">
          {compact ? "最近订阅与声誉事件" : "我的订阅与声誉事件"}
        </h2>
        <span className="rounded-lg bg-white/[0.04] px-3 py-1 text-xs font-semibold text-[#a1a1aa]">
          {subscriptions.length} records
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {subscriptions.map((subscription) => (
          <div
            className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"
            key={subscription.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">{subscription.title}</p>
                <p className="mt-1 text-xs text-[#71717a]">
                  {subscription.buyer} → {subscription.seller}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-lg border px-3 py-1 text-xs font-semibold ${statusStyles[subscription.status]}`}
              >
                {subscription.status}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-sm font-black text-[#f5d98a]">{subscription.value}</span>
              {subscription.status === "Subscribed" ? (
                <button
                  className="rounded-lg bg-[#e2b64f] px-4 py-2 text-xs font-bold text-[#09090b]"
                  onClick={() => onSubmitFeedback(subscription.id)}
                  type="button"
                >
                  提交反馈
                </button>
              ) : subscription.status === "Feedback" ? (
                <button
                  className="rounded-lg bg-[#e2b64f] px-4 py-2 text-xs font-bold text-[#09090b]"
                  onClick={() => onRelease(subscription.id)}
                  type="button"
                >
                  平台放款
                </button>
              ) : (
                <span className="truncate text-xs text-[#71717a]">{subscription.evidence}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {!compact && txHash ? (
        <a
          className="mt-4 flex items-center justify-between rounded-xl border border-[#e2b64f]/25 bg-[#e2b64f]/10 px-4 py-3 text-sm font-bold text-[#f5d98a]"
          href={`https://testnet.monadexplorer.com/tx/${txHash}`}
          rel="noreferrer"
          target="_blank"
        >
          查看最近交易
          <ArrowUpRight size={17} />
        </a>
      ) : null}
    </section>
  );
}

function LedgerPanel({
  opportunityHash,
  selectedSignal,
  txHash,
  versionHash,
}: {
  opportunityHash: string;
  selectedSignal: MatchSignal;
  txHash?: string;
  versionHash: string;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0f0f13]/85 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#e2b64f]/15 text-[#f5d98a]">
          <WalletCards size={19} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Monad 链上可信账本</h2>
          <p className="mt-1 text-sm leading-6 text-[#a1a1aa]">
            GitHub 更新中的 indexer 思路已合入产品结构：前端可直接展示事件，生产版接 Envio/GraphQL 做完整历史同步。
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <InfoPill label="Version hash" value={shortAddress(versionHash)} />
        <InfoPill label="Intent hash" value={shortAddress(opportunityHash)} />
        <InfoPill label="Latest tx" value={txHash ? shortAddress(txHash) : "等待交易"} />
      </div>
      <div className="mt-5 grid gap-3">
        {ledgerRows.map((row) => (
          <ReadinessItem key={row} text={row} />
        ))}
      </div>
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
        <p className="text-sm font-bold text-white">当前匹配摘要</p>
        <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">{selectedSignal.intentSummary}</p>
      </div>
    </section>
  );
}

function RightRail({
  isWrongNetwork,
  selectedAsset,
  statusMessage,
  subscribeToAsset,
  transactionBusy,
  txHash,
  versionHash,
}: {
  isWrongNetwork: boolean;
  selectedAsset: CapabilityAsset;
  statusMessage: string;
  subscribeToAsset: (asset: CapabilityAsset) => void;
  transactionBusy: boolean;
  txHash?: string;
  versionHash: string;
}) {
  return (
    <aside className="flex min-w-0 flex-col gap-5">
      <section className="rounded-2xl border border-[#e2b64f]/25 bg-[linear-gradient(145deg,rgba(226,182,79,0.16),rgba(24,24,27,0.96))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#f5d98a]">当前交易资产</p>
            <h2 className="mt-2 text-2xl font-black text-white">{selectedAsset.title}</h2>
          </div>
          <span className="rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold text-white">
            {selectedAsset.match}% fit
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-[#d4d4d8]">{selectedAsset.summary}</p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <ProofTile label="Price" value={selectedAsset.price} />
          <ProofTile label="Access" value={selectedAsset.duration} />
          <ProofTile label="Rating" value={selectedAsset.rating.toFixed(1)} />
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-[#09090b]/45 p-4">
          <p className="text-sm font-bold text-white">这笔交易会发生什么</p>
          <div className="mt-3 space-y-2">
            <ReadinessItem text="买家支付 MON 订阅当前版本，钱包自动估算 gas" />
            <ReadinessItem text="OPCMarket 记录资产、买家、卖家、金额和 access hash" />
            <ReadinessItem text="订阅成功后进入我的订阅，可提交反馈并形成声誉事件" />
          </div>
        </div>

        <button
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e2b64f] text-sm font-black text-[#09090b] transition hover:bg-[#f5d98a] disabled:opacity-60"
          disabled={transactionBusy || isWrongNetwork}
          onClick={() => subscribeToAsset(selectedAsset)}
          type="button"
        >
          <LockKeyhole size={18} />
          {transactionBusy ? "等待链上确认" : "用 MON 订阅并托管"}
        </button>
        <p className="mt-3 text-xs leading-5 text-[#a1a1aa]">{statusMessage}</p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0f0f13]/85 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
        <h2 className="text-lg font-bold text-white">Monad 可信事件层</h2>
        <div className="mt-4 space-y-3">
          <ChainItem icon={WalletCards} label="Network" value="Monad Testnet / 10143" />
          <ChainItem
            icon={LockKeyhole}
            label="Trust contract"
            value={opcMarketAddress ? shortAddress(opcMarketAddress) : "待部署"}
          />
          <ChainItem icon={Clock3} label="Gas policy" value="wallet-estimated gas" />
          <ChainItem icon={CheckCircle2} label="Version hash" value={shortAddress(versionHash)} />
        </div>
        <div className="mt-4 grid gap-2">
          <NetworkLink href="https://testnet.monad.xyz" label="测试 MON 水龙头" value="testnet.monad.xyz" />
          <NetworkLink href="https://testnet.monadexplorer.com/" label="Monad Explorer" value="testnet.monadexplorer.com" />
          <NetworkLink href="https://monad-testnet.socialscan.io/" label="SocialScan" value="monad-testnet.socialscan.io" />
        </div>
        {txHash ? (
          <NetworkLink
            href={`https://testnet.monadexplorer.com/tx/${txHash}`}
            label="最近交易"
            value={shortAddress(txHash)}
          />
        ) : null}
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0f0f13]/85 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
        <div className="flex items-center gap-2">
          <Sparkles className="text-[#e2b64f]" size={19} />
          <h2 className="text-lg font-bold text-white">5分钟演示顺序</h2>
        </div>
        <div className="mt-4 space-y-3">
          {demoBeats.map((beat) => (
            <ReadinessItem key={beat} text={beat} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0f0f13]/85 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
        <h2 className="text-lg font-bold text-white">MOJO 提交包</h2>
        <div className="mt-4 grid gap-2">
          {submissionItems.map((item) => (
            <ReadinessItem key={item} text={item} />
          ))}
        </div>
      </section>
    </aside>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f0f13]/85 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
      <div className="flex size-10 items-center justify-center rounded-xl bg-[#e2b64f]/15 text-[#f5d98a]">
        <Icon size={19} />
      </div>
      <p className="mt-4 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-sm text-[#a1a1aa]">{label}</p>
    </div>
  );
}

function ProofTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-3">
      <p className="text-xs font-medium text-[#d4d4d8]">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-3 py-3">
      <p className="text-xs font-medium text-[#71717a]">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#71717a]">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-[#d4d4d8]">{value}</p>
    </div>
  );
}

function DraftField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-xs font-semibold uppercase text-[#71717a]">{label}</p>
      <p className="mt-2 truncate text-sm font-bold text-white">{value}</p>
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
    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#0f0f13] px-3 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-[#f5d98a]">
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#71717a]">{label}</p>
        <p className="mt-1 text-sm leading-6 text-[#d4d4d8]">{value}</p>
      </div>
    </div>
  );
}

function ChainItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-[#f5d98a]">
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#71717a]">{label}</p>
        <p className="truncate text-sm font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function NetworkLink({
  href,
  label,
  value,
}: {
  href: string;
  label: string;
  value: string;
}) {
  return (
    <a
      className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3 text-sm transition hover:border-[#e2b64f]/30"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <span className="font-medium text-[#a1a1aa]">{label}</span>
      <span className="flex min-w-0 items-center gap-2 truncate font-bold text-white">
        {value}
        <ArrowUpRight className="shrink-0 text-[#e2b64f]" size={15} />
      </span>
    </a>
  );
}

function ReadinessItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3 text-sm leading-6 text-[#a1a1aa]">
      <CheckCircle2 className="mt-0.5 shrink-0 text-[#e2b64f]" size={17} />
      <span>{text}</span>
    </div>
  );
}

function ReadinessLine({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-[#a1a1aa]">
      {ok ? (
        <CheckCircle2 className="text-emerald-300" size={16} />
      ) : (
        <AlertTriangle className="text-[#e2b64f]" size={16} />
      )}
      <span>{text}</span>
    </div>
  );
}

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
