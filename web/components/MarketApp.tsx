"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useMemo, useState } from "react";
import { encodeDeployData, encodeFunctionData, isAddress, parseEther, type Address, type Hex } from "viem";
import {
  useAccount,
  useChainId,
  useDeployContract,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { monadTestnet } from "wagmi/chains";
import { getContractAddress, monadTestnetChainId, opcTrustMarketAbi } from "@/lib/contracts";
import { opcTrustMarketBytecode } from "@/lib/generated/opcTrustMarketArtifact";
import { fetchIndexedMarketData } from "@/lib/indexer";
import { addMonadTestnetToWallet } from "@/lib/walletNetwork";
import {
  assetTypeFromContractValue,
  assetTypeLabels,
  assetTypeToContractValue,
  contentHashFor,
  decodeMetadata,
  encodeMetadata,
  formatMon,
  productionLabels,
  productionModeFromContractValue,
  productionModeToContractValue,
  sameAddress,
  shorten,
  type AssetTypeLabel,
  type ContractMetadata,
  type KnowledgeContract,
  type ProductionModeLabel,
  type SubscriptionRecord,
  type TrustEventRow,
} from "@/lib/marketData";

const envContractAddress = getContractAddress();
const indexerGraphqlUrl = process.env.NEXT_PUBLIC_INDEXER_GRAPHQL_URL;
const explorerBaseUrl = "https://testnet.monadexplorer.com";
const constructorAbi = [
  {
    type: "constructor",
    inputs: [{ name: "initialFeeRecipient", type: "address" }],
    stateMutability: "nonpayable",
  },
] as const;

type Page = "square" | "submit" | "mine" | "ledger";
type PendingAction = {
  type: "deploy" | "register" | "version" | "subscribe" | "feedback" | "release";
  label: string;
};

type AnyEventLog = {
  args: Record<string, any>;
  transactionHash?: Hex | null;
};

const defaultMetadata: ContractMetadata = {
  title: "AI Agent 增长方法论包",
  summary: "给小团队使用的 AI Agent 产品增长知识合约，包含定位、定价和发布节奏。",
  preview: "免费预览：定位地图、定价检查点、发布顺序和买家异议处理。",
  body: "完整内容：定位矩阵、渠道优先级、定价实验表、发布清单、客户异议处理脚本和复盘模板。",
  updateCadence: "Monthly",
  opcName: "我的 OPC 工作室",
  portfolioSamples: ["AI 产品定价拆解", "链上增长研究 memo", "数据供应商尽调清单"],
};

export default function MarketApp() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId: monadTestnetChainId });
  const { switchChain } = useSwitchChain();
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { deployContract, data: deployHash, isPending: isDeployPending, error: deployError } = useDeployContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const { data: deployReceipt, isLoading: isDeployConfirming, isSuccess: isDeploySuccess } = useWaitForTransactionReceipt({ hash: deployHash });

  const [page, setPage] = useState<Page>("square");
  const [contracts, setContracts] = useState<KnowledgeContract[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [events, setEvents] = useState<TrustEventRow[]>([
    { type: "SystemReady", detail: "等待 MetaMask 连接 Monad testnet。" },
  ]);
  const [selectedId, setSelectedId] = useState<bigint>();
  const [lastSyncedBlock, setLastSyncedBlock] = useState<bigint>();
  const [pendingAction, setPendingAction] = useState<PendingAction>();
  const [metadataDraft, setMetadataDraft] = useState<ContractMetadata>(defaultMetadata);
  const [assetDraft, setAssetDraft] = useState({
    type: "Template / Methodology" as AssetTypeLabel,
    productionMode: "AI-assisted" as ProductionModeLabel,
    priceMon: "0.01",
    contentUri: "ipfs://opc-agent-growth-v1",
  });
  const [releaseSubscriptionId, setReleaseSubscriptionId] = useState("");
  const [feedbackScore, setFeedbackScore] = useState(5);
  const [networkError, setNetworkError] = useState("");
  const [localContractAddress, setLocalContractAddress] = useState<Address>();
  const [contractAddressDraft, setContractAddressDraft] = useState("");
  const [directTxHash, setDirectTxHash] = useState<Hex>();
  const [actionBusy, setActionBusy] = useState(false);
  const [directAddress, setDirectAddress] = useState<Address>();
  const [directChainId, setDirectChainId] = useState<number>();

  const selectedContract = contracts.find((item) => item.assetId === selectedId) ?? contracts[0];
  const contractAddress = envContractAddress ?? localContractAddress;
  const walletAddress = address ?? directAddress;
  const walletChainId = chainId || directChainId;
  const walletConnected = isConnected || Boolean(directAddress);
  const needsNetwork = walletConnected && walletChainId !== monadTestnetChainId;
  const canWrite = Boolean(contractAddress && walletAddress && !needsNetwork && !actionBusy);
  const myListedContracts = walletAddress ? contracts.filter((item) => sameAddress(item.owner, walletAddress)) : [];
  const mySubscriptions = walletAddress ? subscriptions.filter((item) => sameAddress(item.buyer, walletAddress)) : [];
  const hasAccessToSelected = mySubscriptions.some((item) => item.assetId === selectedContract?.assetId);

  const { data: walletVerified, refetch: refetchVerified } = useReadContract({
    abi: opcTrustMarketAbi,
    address: contractAddress,
    functionName: "verifiedOpc",
    args: walletAddress ? [walletAddress] : undefined,
    query: { enabled: Boolean(contractAddress && walletAddress) },
  });

  const { data: nextAssetId } = useReadContract({
    abi: opcTrustMarketAbi,
    address: contractAddress,
    functionName: "nextAssetId",
    query: { enabled: Boolean(contractAddress) },
  });

  const readiness = useMemo(() => {
    if (!walletConnected) return { tone: "warn", text: "连接 MetaMask" };
    if (needsNetwork) return { tone: "warn", text: "切换 Monad testnet" };
    if (!contractAddress) return { tone: "bad", text: "缺少合约地址" };
    return { tone: "ok", text: "可发起真实交易" };
  }, [contractAddress, needsNetwork, walletConnected]);

  useEffect(() => {
    const stored = window.localStorage.getItem("opcTrustMarketAddress");
    if (stored && isAddress(stored)) {
      setLocalContractAddress(stored);
      setContractAddressDraft(stored);
    }
    void refreshDirectWallet();
  }, []);

  async function syncChainEvents() {
    try {
      const indexed = await fetchIndexedMarketData(indexerGraphqlUrl);
      if (indexed) {
        setContracts(indexed.contracts);
        setSubscriptions(indexed.subscriptions);
        setEvents(indexed.events.length > 0 ? indexed.events : [{ type: "IndexerReady", detail: "Indexer 已连接，暂无链上事件。" }]);
        setLastSyncedBlock(undefined);
        if (indexed.contracts[0] && (!selectedId || !indexed.contracts.some((item) => item.assetId === selectedId))) {
          setSelectedId(indexed.contracts[0].assetId);
        }
        return;
      }
    } catch (syncError) {
      setEvents((rows) => [
        { type: "IndexerFallback", detail: syncError instanceof Error ? syncError.message : "Indexer 同步失败，回退到 RPC 事件扫描。" },
        ...rows,
      ]);
    }

    if (!publicClient || !contractAddress) {
      setContracts([]);
      setSubscriptions([]);
      setEvents([{ type: "NoContract", detail: "还没有市场合约地址。请先用 MetaMask 部署市场合约。" }]);
      return;
    }

    const latestBlock = await publicClient.getBlockNumber();
    const fromBlock = latestBlock > 99n ? latestBlock - 99n : 0n;
    const [registeredLogs, versionLogs, subscriptionLogs, feedbackLogs, releaseLogs] = await Promise.all([
      getContractEventsSafe(publicClient, {
        address: contractAddress,
        abi: opcTrustMarketAbi,
        eventName: "KnowledgeAssetRegistered",
        fromBlock,
        toBlock: latestBlock,
      }),
      getContractEventsSafe(publicClient, {
        address: contractAddress,
        abi: opcTrustMarketAbi,
        eventName: "AssetVersionPublished",
        fromBlock,
        toBlock: latestBlock,
      }),
      getContractEventsSafe(publicClient, {
        address: contractAddress,
        abi: opcTrustMarketAbi,
        eventName: "SubscriptionPurchased",
        fromBlock,
        toBlock: latestBlock,
      }),
      getContractEventsSafe(publicClient, {
        address: contractAddress,
        abi: opcTrustMarketAbi,
        eventName: "StructuredFeedbackSubmitted",
        fromBlock,
        toBlock: latestBlock,
      }),
      getContractEventsSafe(publicClient, {
        address: contractAddress,
        abi: opcTrustMarketAbi,
        eventName: "EscrowReleased",
        fromBlock,
        toBlock: latestBlock,
      }),
    ]) as [AnyEventLog[], AnyEventLog[], AnyEventLog[], AnyEventLog[], AnyEventLog[]];

    const nextContracts = new Map<bigint, KnowledgeContract>();
    for (const log of registeredLogs) {
      const args = log.args;
      if (!args.assetId || !args.owner || args.assetType === undefined || args.productionMode === undefined || !args.priceWei || !args.metadataUri) {
        continue;
      }
      const metadata = decodeMetadata(args.metadataUri);
      nextContracts.set(args.assetId, {
        assetId: args.assetId,
        owner: args.owner,
        type: assetTypeFromContractValue(args.assetType),
        productionMode: productionModeFromContractValue(args.productionMode),
        priceWei: args.priceWei,
        metadataUri: args.metadataUri,
        metadata,
        subscriberCount: 0,
        feedbackCount: 0,
        source: "chain",
      });
    }

    for (const log of versionLogs) {
      const args = log.args;
      if (!args.assetId || !args.versionId || !args.contentHash || !args.uri) continue;
      const item = nextContracts.get(args.assetId);
      if (item) {
        nextContracts.set(args.assetId, {
          ...item,
          activeVersionId: args.versionId,
          contentHash: args.contentHash,
          contentUri: args.uri,
        });
      }
    }

    const subscriptionRows: SubscriptionRecord[] = subscriptionLogs.flatMap((log) => {
      const args = log.args;
      if (!args.subscriptionId || !args.assetId || !args.buyer || !args.activeVersionId || !args.amountWei || !args.expiresAt) return [];
      const item = nextContracts.get(args.assetId);
      if (item) nextContracts.set(args.assetId, { ...item, subscriberCount: item.subscriberCount + 1 });
      return [{
        subscriptionId: args.subscriptionId,
        assetId: args.assetId,
        buyer: args.buyer,
        activeVersionId: args.activeVersionId,
        amountWei: args.amountWei,
        expiresAt: args.expiresAt,
        transactionHash: log.transactionHash ?? undefined,
      }];
    });

    const feedbackScores = new Map<bigint, number[]>();
    for (const log of feedbackLogs) {
      const args = log.args;
      if (!args.assetId || args.score === undefined) continue;
      feedbackScores.set(args.assetId, [...(feedbackScores.get(args.assetId) ?? []), args.score]);
    }

    for (const [assetId, scores] of feedbackScores) {
      const item = nextContracts.get(assetId);
      if (item) {
        nextContracts.set(assetId, {
          ...item,
          feedbackCount: scores.length,
          averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
        });
      }
    }

    const syncedContracts = [...nextContracts.values()].sort((left, right) => Number(right.assetId - left.assetId));
    setContracts(syncedContracts);
    setSubscriptions(subscriptionRows.sort((left, right) => Number(right.subscriptionId - left.subscriptionId)));
    const syncedEvents = [
      ...registeredLogs.slice(-3).map((log) => ({
        type: "KnowledgeAssetRegistered",
        detail: `知识合约 #${log.args.assetId?.toString() ?? "-"} 已进入合约广场。`,
        transactionHash: log.transactionHash ?? undefined,
      })),
      ...subscriptionLogs.slice(-3).map((log) => ({
        type: "SubscriptionPurchased",
        detail: `订阅 #${log.args.subscriptionId?.toString() ?? "-"} 支付 ${log.args.amountWei ? formatMon(log.args.amountWei) : "-"} MON。`,
        transactionHash: log.transactionHash ?? undefined,
      })),
      ...feedbackLogs.slice(-2).map((log) => ({
        type: "StructuredFeedbackSubmitted",
        detail: `知识合约 #${log.args.assetId?.toString() ?? "-"} 收到 ${log.args.score ?? "-"} 分反馈。`,
        transactionHash: log.transactionHash ?? undefined,
      })),
      ...releaseLogs.slice(-2).map((log) => ({
        type: "EscrowReleased",
        detail: `托管 #${log.args.subscriptionId?.toString() ?? "-"} 已结算。`,
        transactionHash: log.transactionHash ?? undefined,
      })),
    ];
    setEvents(syncedEvents.length > 0 ? syncedEvents : [{ type: "ChainConnected", detail: `已连接市场合约 ${shorten(contractAddress)}，暂无链上交易事件。` }]);
    setLastSyncedBlock(latestBlock);
    if ((!selectedId || !nextContracts.has(selectedId)) && syncedContracts[0]) setSelectedId(syncedContracts[0].assetId);
  }

  useEffect(() => {
    void syncChainEvents();
  }, [publicClient, contractAddress]);

  useEffect(() => {
    if (!isDeploySuccess || !deployReceipt?.contractAddress) return;
    window.localStorage.setItem("opcTrustMarketAddress", deployReceipt.contractAddress);
    setLocalContractAddress(deployReceipt.contractAddress);
    setContractAddressDraft(deployReceipt.contractAddress);
    setEvents((rows) => [
      { type: "ContractDeployed", detail: `市场合约已部署：${deployReceipt.contractAddress}`, transactionHash: deployReceipt.transactionHash },
      ...rows,
    ]);
    if (pendingAction?.type === "deploy") {
      setPendingAction(undefined);
    }
    void syncChainEvents();
  }, [deployReceipt, isDeploySuccess, pendingAction]);

  useEffect(() => {
    if (!isSuccess || !txHash || !pendingAction || pendingAction.type === "deploy") return;
    setEvents((rows) => [
      { type: pendingAction.type, detail: pendingAction.label, transactionHash: txHash },
      ...rows,
    ]);
    if (pendingAction.type === "register" && nextAssetId) {
      const registeredAssetId = nextAssetId;
      setSelectedId(registeredAssetId);
      setPage("submit");
    }
    setPendingAction(undefined);
    void refetchVerified();
    void syncChainEvents();
  }, [isSuccess, nextAssetId, pendingAction, refetchVerified, txHash]);

  function saveManualContractAddress() {
    if (!isAddress(contractAddressDraft)) {
      setNetworkError("请输入有效的市场合约地址");
      return;
    }
    window.localStorage.setItem("opcTrustMarketAddress", contractAddressDraft);
    setLocalContractAddress(contractAddressDraft);
    setNetworkError("");
    void syncChainEvents();
  }

  function deployMarketWithMetaMask() {
    void deployMarketDirect();
  }

  async function deployMarketDirect() {
    const from = await ensureDirectWallet();
    if (!from || !publicClient) return;
    setNetworkError("");
    setActionBusy(true);
    setPendingAction({ type: "deploy", label: "部署 OPCTrustMarket 到 Monad testnet" });
    try {
      const hash = await sendMetaMaskTx({
        from,
        data: encodeDeployData({
          abi: constructorAbi,
          bytecode: opcTrustMarketBytecode,
          args: [from],
        }),
      });
      setDirectTxHash(hash);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (!receipt.contractAddress) throw new Error("部署回执没有 contractAddress");
      window.localStorage.setItem("opcTrustMarketAddress", receipt.contractAddress);
      setLocalContractAddress(receipt.contractAddress);
      setContractAddressDraft(receipt.contractAddress);
      setEvents((rows) => [
        { type: "ContractDeployed", detail: `市场合约已部署：${receipt.contractAddress}`, transactionHash: hash },
        ...rows,
      ]);
    } catch (deployError) {
      setNetworkError(deployError instanceof Error ? deployError.message : "部署失败");
    } finally {
      setActionBusy(false);
      setPendingAction(undefined);
    }
  }

  function registerKnowledgeContract() {
    void uploadAndPublishDirect();
  }

  async function uploadAndPublishDirect() {
    const from = await ensureDirectWallet();
    if (!from || !contractAddress || !publicClient || !nextAssetId) return;
    const metadataUri = encodeMetadata(metadataDraft);
    const assetId = nextAssetId;
    setNetworkError("");
    setActionBusy(true);
    try {
      setPendingAction({ type: "register", label: `登记知识合约：${metadataDraft.title}` });
      const registerHash = await sendMetaMaskTx({
        from,
        to: contractAddress,
        data: encodeFunctionData({
          abi: opcTrustMarketAbi,
          functionName: "registerAsset",
          args: [
            assetTypeToContractValue(assetDraft.type),
            productionModeToContractValue(assetDraft.productionMode),
            parseEther(assetDraft.priceMon),
            metadataUri,
          ],
        }),
      });
      setDirectTxHash(registerHash);
      await publicClient.waitForTransactionReceipt({ hash: registerHash });
      const localAsset: KnowledgeContract = {
        assetId,
        owner: from,
        type: assetDraft.type,
        productionMode: assetDraft.productionMode,
        priceWei: parseEther(assetDraft.priceMon),
        metadataUri,
        metadata: metadataDraft,
        subscriberCount: 0,
        feedbackCount: 0,
        source: "chain",
      };
      setContracts((rows) => [localAsset, ...rows.filter((row) => row.assetId !== assetId)]);
      setSelectedId(assetId);

      setPendingAction({ type: "version", label: `发布有效版本：${metadataDraft.title}` });
      const publishHash = await sendMetaMaskTx({
        from,
        to: contractAddress,
        data: encodeFunctionData({
          abi: opcTrustMarketAbi,
          functionName: "publishVersion",
          args: [assetId, contentHashFor(metadataDraft), assetDraft.contentUri || "ipfs://opc-content"],
        }),
      });
      setDirectTxHash(publishHash);
      await publicClient.waitForTransactionReceipt({ hash: publishHash });
      setContracts((rows) => rows.map((row) => row.assetId === assetId ? {
        ...row,
        activeVersionId: 1n,
        contentHash: contentHashFor(metadataDraft),
        contentUri: assetDraft.contentUri || "ipfs://opc-content",
      } : row));
      setEvents((rows) => [
        { type: "AssetReady", detail: `知识合约 #${assetId.toString()} 已登记并发布版本。`, transactionHash: publishHash },
        ...rows,
      ]);
      setPage("square");
      await syncChainEvents();
    } catch (uploadError) {
      setNetworkError(uploadError instanceof Error ? uploadError.message : "上传合约失败");
    } finally {
      setActionBusy(false);
      setPendingAction(undefined);
    }
  }

  function publishActiveVersion() {
    if (!contractAddress || !selectedContract) return;
    setPendingAction({ type: "version", label: `发布有效版本：${selectedContract.metadata.title}` });
    writeContract({
      abi: opcTrustMarketAbi,
      address: contractAddress,
      functionName: "publishVersion",
      args: [selectedContract.assetId, contentHashFor(selectedContract.metadata), assetDraft.contentUri || selectedContract.contentUri || "ipfs://opc-content"],
    });
  }

  function subscribeSelected() {
    void subscribeDirect();
  }

  async function subscribeDirect() {
    const from = await ensureDirectWallet();
    if (!from || !contractAddress || !selectedContract || !publicClient) return;
    setNetworkError("");
    setActionBusy(true);
    setPendingAction({ type: "subscribe", label: `订阅 ${selectedContract.metadata.title}，支付 ${formatMon(selectedContract.priceWei)} MON。` });
    try {
      const hash = await sendMetaMaskTx({
        from,
        to: contractAddress,
        data: encodeFunctionData({
          abi: opcTrustMarketAbi,
          functionName: "subscribe",
          args: [selectedContract.assetId],
        }),
        value: `0x${selectedContract.priceWei.toString(16)}`,
      });
      setDirectTxHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });
      setEvents((rows) => [
        { type: "SubscriptionPurchased", detail: `已订阅知识合约 #${selectedContract.assetId.toString()}。`, transactionHash: hash },
        ...rows,
      ]);
      setPage("mine");
      await syncChainEvents();
    } catch (subscribeError) {
      setNetworkError(subscribeError instanceof Error ? subscribeError.message : "订阅失败");
    } finally {
      setActionBusy(false);
      setPendingAction(undefined);
    }
  }

  function submitFeedback() {
    if (!contractAddress || !selectedContract) return;
    setPendingAction({ type: "feedback", label: `评价知识合约 #${selectedContract.assetId.toString()}` });
    writeContract({
      abi: opcTrustMarketAbi,
      address: contractAddress,
      functionName: "submitStructuredFeedback",
      args: [selectedContract.assetId, feedbackScore],
    });
  }

  function releaseEscrow() {
    if (!contractAddress || !releaseSubscriptionId) return;
    setPendingAction({ type: "release", label: `释放托管订阅 #${releaseSubscriptionId}` });
    writeContract({
      abi: opcTrustMarketAbi,
      address: contractAddress,
      functionName: "releaseMyEscrow",
      args: [BigInt(releaseSubscriptionId)],
    });
  }

  async function addOrSwitchMonadTestnet() {
    setNetworkError("");
    try {
      await addMonadTestnetToWallet();
      if (isConnected) switchChain({ chainId: monadTestnet.id });
    } catch (networkSwitchError) {
      setNetworkError(networkSwitchError instanceof Error ? networkSwitchError.message : "MetaMask 网络请求失败");
    }
  }

  async function refreshDirectWallet() {
    const ethereum = getEthereumProvider();
    if (!ethereum) return;
    const [account] = await ethereum.request({ method: "eth_accounts" }) as Address[];
    const chainHex = await ethereum.request({ method: "eth_chainId" }) as Hex;
    if (account) setDirectAddress(account);
    setDirectChainId(Number.parseInt(chainHex, 16));
  }

  async function ensureDirectWallet() {
    const ethereum = getEthereumProvider();
    if (!ethereum) {
      setNetworkError("没有检测到 MetaMask。请在 Chrome 安装/启用 MetaMask。");
      return undefined;
    }
    const [account] = await ethereum.request({ method: "eth_requestAccounts" }) as Address[];
    const chainHex = await ethereum.request({ method: "eth_chainId" }) as Hex;
    setDirectAddress(account);
    setDirectChainId(Number.parseInt(chainHex, 16));
    if (Number.parseInt(chainHex, 16) !== monadTestnetChainId) {
      await addMonadTestnetToWallet();
      const nextChainHex = await ethereum.request({ method: "eth_chainId" }) as Hex;
      setDirectChainId(Number.parseInt(nextChainHex, 16));
    }
    return account;
  }

  return (
    <main className="terminalShell">
      <header className="topBar">
        <div>
          <p className="eyebrow">OPC Trust Market / Monad Testnet</p>
          <h1>知识合约真实交易平台</h1>
        </div>
        <div className="walletStack">
          <button className="primaryButton" onClick={() => void ensureDirectWallet()}>
            {walletAddress ? `MetaMask ${shorten(walletAddress)}` : "直连 MetaMask"}
          </button>
          <ConnectButton />
        </div>
      </header>

      <nav className="navTabs" aria-label="Main navigation">
        <button className={page === "square" ? "active" : ""} onClick={() => setPage("square")}>合约广场</button>
        <button className={page === "submit" ? "active" : ""} onClick={() => setPage("submit")}>上传合约</button>
        <button className={page === "mine" ? "active" : ""} onClick={() => setPage("mine")}>我的合约</button>
        <button className={page === "ledger" ? "active" : ""} onClick={() => setPage("ledger")}>链上账本</button>
      </nav>

      <section className="metricsGrid">
        <Metric label="钱包" value={walletAddress ? shorten(walletAddress) : "未连接"} />
        <Metric label="网络" value={walletChainId ? String(walletChainId) : "未知"} tone={needsNetwork ? "warn" : undefined} />
        <Metric label="交易合约" value={contractAddress ? shorten(contractAddress) : "未配置"} tone={contractAddress ? undefined : "bad"} />
        <Metric label="交易状态" value={readiness.text} tone={readiness.tone} />
        <Metric label="OPC 资格" value={walletVerified ? "Verified" : "未验证"} tone={walletVerified ? "ok" : "warn"} />
        <Metric label="同步区块" value={lastSyncedBlock ? lastSyncedBlock.toString() : "未同步"} />
      </section>

      {needsNetwork && (
        <section className="noticeBand">
          <strong>MetaMask 当前不在 Monad testnet</strong>
          <div className="noticeActions">
            <button onClick={() => switchChain({ chainId: monadTestnet.id })}>切换网络</button>
            <button onClick={addOrSwitchMonadTestnet}>添加 Monad testnet</button>
          </div>
        </section>
      )}

      {!walletConnected && (
        <section className="noticeBand">
          <strong>使用 MetaMask 连接后可添加 Monad testnet 并发起真实交易</strong>
          <div className="noticeActions">
            <button onClick={() => void ensureDirectWallet()}>直连 MetaMask</button>
            <button onClick={addOrSwitchMonadTestnet}>添加 Monad testnet</button>
          </div>
        </section>
      )}

      {walletConnected && !contractAddress && !needsNetwork && (
        <section className="noticeBand">
          <strong>尚未部署市场合约。用当前 MetaMask 钱包部署后即可真实上传和订阅。</strong>
          <button onClick={deployMarketWithMetaMask} disabled={isDeployPending || isDeployConfirming}>
            {isDeployPending || isDeployConfirming ? "部署中" : "部署市场合约"}
          </button>
        </section>
      )}

      {walletConnected && !needsNetwork && (
        <section className="noticeBand">
          <strong>市场合约地址</strong>
          <div className="addressSetter">
            <input value={contractAddressDraft} onChange={(event) => setContractAddressDraft(event.target.value)} placeholder="0x..." />
            <button onClick={saveManualContractAddress}>使用该地址</button>
          </div>
        </section>
      )}

      {networkError && <section className="noticeBand dangerText"><strong>{networkError}</strong></section>}

      {page === "square" && (
        <section className="marketLayout">
          <aside className="panel listPanel">
            <div className="panelHeader">
              <p className="eyebrow">Market</p>
              <button className="ghostButton" onClick={() => void syncChainEvents()}>同步</button>
            </div>
            <div className="contractRows">
              {contracts.length === 0 && <div className="emptyState">合约广场暂无链上资产。先到“上传合约”登记并发布版本。</div>}
              {contracts.map((item) => (
                <button
                  className={item.assetId === selectedContract.assetId ? "contractRow active" : "contractRow"}
                  key={item.assetId.toString()}
                  onClick={() => setSelectedId(item.assetId)}
                >
                  <span>#{item.assetId.toString()}</span>
                  <strong>{item.metadata.title}</strong>
                  <em>{formatMon(item.priceWei)} MON</em>
                </button>
              ))}
            </div>
          </aside>

          {selectedContract ? (
            <ContractDetail
              contract={selectedContract}
              canWrite={canWrite}
              hasAccess={hasAccessToSelected}
              isPending={isPending}
              onSubscribe={subscribeSelected}
              onFeedback={submitFeedback}
              feedbackScore={feedbackScore}
              setFeedbackScore={setFeedbackScore}
            />
          ) : (
            <div className="panel emptyState">没有可订阅的链上知识合约。</div>
          )}
        </section>
      )}

      {page === "submit" && (
        <section className="workspaceGrid">
          <div className="panel">
            <p className="eyebrow">Upload</p>
            <h2>上传知识合约</h2>
            <div className="formGrid">
              <Field label="OPC 名称" value={metadataDraft.opcName} onChange={(value) => setMetadataDraft({ ...metadataDraft, opcName: value })} />
              <Field label="订阅价格 MON" value={assetDraft.priceMon} onChange={(value) => setAssetDraft({ ...assetDraft, priceMon: value })} />
              <label>
                <span>资产类型</span>
                <select value={assetDraft.type} onChange={(event) => setAssetDraft({ ...assetDraft, type: event.target.value as AssetTypeLabel })}>
                  <option value="Document / Report">研究报告</option>
                  <option value="Template / Methodology">模板方法论</option>
                  <option value="Dataset / Annotation Pack">数据标注包</option>
                </select>
              </label>
              <label>
                <span>生产方式</span>
                <select value={assetDraft.productionMode} onChange={(event) => setAssetDraft({ ...assetDraft, productionMode: event.target.value as ProductionModeLabel })}>
                  <option value="Human-authored">人工原创</option>
                  <option value="AI-assisted">AI 辅助</option>
                  <option value="Agent-executed">Agent 执行</option>
                </select>
              </label>
              <Field label="合约标题" value={metadataDraft.title} onChange={(value) => setMetadataDraft({ ...metadataDraft, title: value })} wide />
              <TextField label="广场摘要" value={metadataDraft.summary} onChange={(value) => setMetadataDraft({ ...metadataDraft, summary: value })} />
              <TextField label="免费预览" value={metadataDraft.preview} onChange={(value) => setMetadataDraft({ ...metadataDraft, preview: value })} />
              <TextField label="订阅后正文" value={metadataDraft.body} onChange={(value) => setMetadataDraft({ ...metadataDraft, body: value })} />
              <Field label="内容 URI" value={assetDraft.contentUri} onChange={(value) => setAssetDraft({ ...assetDraft, contentUri: value })} wide />
            </div>
            <button className="primaryButton" onClick={registerKnowledgeContract} disabled={!canWrite || !nextAssetId}>
              {actionBusy && pendingAction?.type !== "subscribe" ? "链上处理中" : "上传并发布到链上"}
            </button>
          </div>

          <div className="panel">
            <p className="eyebrow">Version</p>
            <h2>发布有效版本</h2>
            {selectedContract ? (
              <>
                <p className="muted">当前选择 #{selectedContract.assetId.toString()}：{selectedContract.metadata.title}</p>
                <code>{contentHashFor(selectedContract.metadata)}</code>
                <button className="secondaryButton" onClick={publishActiveVersion} disabled={!canWrite || !sameAddress(selectedContract.owner, walletAddress) || isPending}>
                  发布/更新版本
                </button>
              </>
            ) : (
              <div className="emptyState">先登记一个知识合约。</div>
            )}
          </div>
        </section>
      )}

      {page === "mine" && (
        <section className="workspaceGrid">
          <div className="panel">
            <p className="eyebrow">Seller</p>
            <h2>我上传的合约</h2>
            <CardList items={myListedContracts} empty="当前钱包还没有上传知识合约。" onSelect={setSelectedId} />
            <div className="releaseBox">
              <Field label="释放托管订阅 ID" value={releaseSubscriptionId} onChange={setReleaseSubscriptionId} />
              <button className="secondaryButton" onClick={releaseEscrow} disabled={!canWrite || !releaseSubscriptionId || isPending}>释放托管</button>
            </div>
          </div>
          <div className="panel">
            <p className="eyebrow">Buyer</p>
            <h2>我的订阅</h2>
            {mySubscriptions.length === 0 && <div className="emptyState">当前钱包还没有订阅记录。</div>}
            <div className="subscriptionRows">
              {mySubscriptions.map((sub) => {
                const item = contracts.find((contract) => contract.assetId === sub.assetId);
                return (
                  <article className="subscriptionCard" key={sub.subscriptionId.toString()}>
                    <strong>{item?.metadata.title ?? `知识合约 #${sub.assetId.toString()}`}</strong>
                    <span>{formatMon(sub.amountWei)} MON · 订阅 #{sub.subscriptionId.toString()}</span>
                    <span>到期：{new Date(Number(sub.expiresAt) * 1000).toLocaleString("zh-CN")}</span>
                    {sub.transactionHash && <ExplorerLink tx={sub.transactionHash} />}
                    {item && (
                      <div className="unlockBox">
                        <strong>订阅者内容</strong>
                        <p>{item.metadata.body}</p>
                        <code>{item.contentHash ?? contentHashFor(item.metadata)}</code>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {page === "ledger" && (
        <section className="panel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Trust Events</p>
              <h2>链上账本</h2>
            </div>
            <button className="ghostButton" onClick={() => void syncChainEvents()}>刷新</button>
          </div>
          {(directTxHash || txHash) && (
            <div className={isSuccess ? "txBox success" : "txBox"}>
              <strong>{actionBusy || isConfirming ? "交易确认中" : "交易已提交"}</strong>
              <ExplorerLink tx={(directTxHash ?? txHash) as Hex} />
            </div>
          )}
        {error && <div className="txBox danger">{error.message}</div>}
        {deployError && <div className="txBox danger">{deployError.message}</div>}
          <div className="eventRows">
            {events.map((event, index) => (
              <article className="eventItem" key={`${event.type}-${index}`}>
                <strong>{event.type}</strong>
                <p>{event.detail}</p>
                {event.transactionHash && <ExplorerLink tx={event.transactionHash} />}
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function ContractDetail({
  contract,
  canWrite,
  hasAccess,
  isPending,
  onSubscribe,
  onFeedback,
  feedbackScore,
  setFeedbackScore,
}: {
  contract: KnowledgeContract;
  canWrite: boolean;
  hasAccess: boolean;
  isPending: boolean;
  onSubscribe: () => void;
  onFeedback: () => void;
  feedbackScore: number;
  setFeedbackScore: (score: number) => void;
}) {
  const isRealChainAsset = contract.source !== "draft";
  const canSubscribe = canWrite && isRealChainAsset && Boolean(contract.activeVersionId) && !isPending;

  return (
    <article className="panel detailPanel">
      <div className="detailTop">
        <div>
          <p className="eyebrow">Knowledge Contract #{contract.assetId.toString()}</p>
          <h2>{contract.metadata.title}</h2>
          <p>{contract.metadata.summary}</p>
        </div>
        <div className="priceBox">
          <span>Subscription</span>
          <strong>{formatMon(contract.priceWei)} MON</strong>
        </div>
      </div>
      <div className="tagRow">
        <span>{assetTypeLabels[contract.type]}</span>
        <span>{productionLabels[contract.productionMode]}</span>
        <span>{contract.metadata.updateCadence}</span>
        <span>{contract.activeVersionId ? `v${contract.activeVersionId.toString()}` : "未发布版本"}</span>
      </div>
      <div className="splitGrid">
        <div className="infoBlock">
          <strong>免费预览</strong>
          <p>{contract.metadata.preview}</p>
        </div>
        <div className="infoBlock">
          <strong>OPC</strong>
          <p>{contract.metadata.opcName}</p>
          <code>{contract.owner}</code>
        </div>
      </div>
      <div className="marketStats">
        <Metric label="订阅数" value={String(contract.subscriberCount)} />
        <Metric label="反馈数" value={String(contract.feedbackCount)} />
        <Metric label="均分" value={contract.averageScore ? contract.averageScore.toFixed(1) : "-"} />
        <Metric label="来源" value={contract.source} />
      </div>
      <div className="tradeBox">
        <button className="primaryButton" onClick={onSubscribe} disabled={!canSubscribe}>立即订阅</button>
        <label className="scoreControl">
          <span>反馈分</span>
          <input type="number" min="1" max="5" value={feedbackScore} onChange={(event) => setFeedbackScore(Number(event.target.value))} />
        </label>
        <button className="secondaryButton" onClick={onFeedback} disabled={!canWrite || !hasAccess || isPending}>提交评价</button>
      </div>
      {!isRealChainAsset && <div className="emptyState">这不是链上资产，不能真实订阅。请先上传并同步链上合约。</div>}
      {isRealChainAsset && !contract.activeVersionId && <div className="emptyState">该知识合约还没有发布有效版本，发布者需要先发布版本。</div>}
      {hasAccess && (
        <div className="unlockBox">
          <strong>订阅者可见内容</strong>
          <p>{contract.metadata.body}</p>
          <code>{contract.contentHash ?? contentHashFor(contract.metadata)}</code>
        </div>
      )}
    </article>
  );
}

function CardList({ items, empty, onSelect }: { items: KnowledgeContract[]; empty: string; onSelect: (assetId: bigint) => void }) {
  if (items.length === 0) return <div className="emptyState">{empty}</div>;
  return (
    <div className="contractRows">
      {items.map((item) => (
        <button className="contractRow" key={item.assetId.toString()} onClick={() => onSelect(item.assetId)}>
          <span>#{item.assetId.toString()}</span>
          <strong>{item.metadata.title}</strong>
          <em>{formatMon(item.priceWei)} MON</em>
        </button>
      ))}
    </div>
  );
}

function Field({ label, value, onChange, wide }: { label: string; value: string; onChange: (value: string) => void; wide?: boolean }) {
  return (
    <label className={wide ? "wide" : undefined}>
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="wide">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className={`metric ${tone ?? ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ExplorerLink({ tx }: { tx: Hex }) {
  return (
    <a href={`${explorerBaseUrl}/tx/${tx}`} target="_blank" rel="noreferrer">
      {shorten(tx)}
    </a>
  );
}

function getEthereumProvider() {
  return (window as Window & { ethereum?: { request(args: { method: string; params?: unknown[] }): Promise<unknown> } }).ethereum;
}

async function sendMetaMaskTx(tx: { from: Address; to?: Address; data?: Hex; value?: Hex }) {
  const ethereum = getEthereumProvider();
  if (!ethereum) throw new Error("MetaMask provider not found");
  return await ethereum.request({
    method: "eth_sendTransaction",
    params: [tx],
  }) as Hex;
}

async function getContractEventsSafe(
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>,
  args: any,
) {
  const fromBlock = BigInt(args.fromBlock ?? 0n);
  const toBlock = BigInt(args.toBlock ?? fromBlock);
  const logs: AnyEventLog[] = [];
  for (let cursor = fromBlock; cursor <= toBlock; cursor += 100n) {
    const chunkTo = cursor + 99n > toBlock ? toBlock : cursor + 99n;
    logs.push(...await publicClient.getContractEvents({ ...args, fromBlock: cursor, toBlock: chunkTo }) as AnyEventLog[]);
  }
  return logs;
}
