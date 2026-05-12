# OPC KnoVault

Monad testnet 上的 OPC 知识合约交易平台。用户可以用 MetaMask 部署市场合约、上传知识合约、发布版本，并在合约广场用真实 testnet MON 订阅交易。

## 功能

- 合约广场：展示链上登记的 Knowledge Contract。
- 上传合约：调用 `registerAsset` 登记知识合约，并调用 `publishVersion` 发布有效版本。
- 真实订阅：调用 `subscribe(assetId)`，通过 MetaMask 支付 Monad testnet MON。
- 我的合约：查看当前钱包上传的合约和订阅记录。
- 链上账本：同步合约事件，展示交易回执。
- MetaMask 部署：无需 Foundry，本页面可直接用 MetaMask 部署 `OPCTrustMarket`。

## 技术栈

- `web/`：Next.js + RainbowKit + Wagmi + viem。
- `contracts/OPCTrustMarket.sol`：Monad/EVM 市场合约，处理登记、版本、订阅、托管、退款、评价事件。
- `scripts/build-contract-artifact.mjs`：用 `solc` 生成前端部署 bytecode。
- `indexer/`：Envio HyperIndex-ready 模板，生产环境可用于完整历史事件同步。
- `src/domain/marketplace.js` 和 `tests/marketplace.test.js`：领域核心和行为测试。

## 本地运行

```bash
npm install
npm run artifact:contract
npm run dev
```

打开：

```text
http://localhost:3000
```

验证：

```bash
npm test
npm run typecheck
npm run build
```

## Monad Testnet

- Chain ID: `10143`
- RPC: `https://testnet-rpc.monad.xyz/`
- Symbol: `MON`
- Explorer: `https://testnet.monadexplorer.com/`

前端有“添加 Monad testnet”按钮，会向 MetaMask 发起 `wallet_addEthereumChain` 请求。

## 环境变量

可选复制：

```bash
cp web/.env.example web/.env.local
```

可选配置：

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_OPC_TRUST_MARKET_ADDRESS=
NEXT_PUBLIC_INDEXER_GRAPHQL_URL=
```

如果不配置 `NEXT_PUBLIC_OPC_TRUST_MARKET_ADDRESS`，页面会允许用 MetaMask 直接部署市场合约，并把地址保存到浏览器 `localStorage` 的 `opcTrustMarketAddress`。

## 真实交易流程

1. 打开 `http://localhost:3000`。
2. 点击右上角“直连 MetaMask”。
3. 切换到 Monad testnet。
4. 如果页面提示没有市场合约，点击“部署市场合约”，在 MetaMask 确认部署交易。
5. 部署成功后，页面会保存市场合约地址。
6. 进入“上传合约”。
7. 填写 OPC 名称、价格、标题、摘要、预览、正文和内容 URI。
8. 点击“上传并发布到链上”。
9. MetaMask 会确认两笔交易：`registerAsset` 和 `publishVersion`。
10. 回到“合约广场”，点击“同步”。
11. 选择刚发布的链上合约，点击“立即订阅”。
12. MetaMask 确认 `subscribe(assetId)`，并支付 testnet MON。
13. 交易确认后，可在“我的合约”和“链上账本”查看记录。

## 重要说明

- 这是 Monad testnet 真实链上交易，不是模拟购买。
- 当前版本默认 `openPublishing = true`，任何钱包都可以登记知识合约，避免 demo 被审核流程阻塞。
- 只有已经登记且发布版本的链上资产才能订阅。
- 内容正文当前存储在前端 metadata/data URI 中，生产环境应换成 IPFS、Arweave 或后端存储，并只在链上记录 hash/URI。
- Monad RPC 的 `eth_getLogs` 单次查询限制为 100 block。前端已限制最近 100 block 并做分片查询；更完整的历史同步应部署 `indexer/`。

## 常见问题

### 页面说不能上传或不能交易

先点击“直连 MetaMask”，确认顶部状态：

- 钱包不是“未连接”
- 网络是 `10143`
- 交易合约不是“未配置”

如果没有市场合约，先点击“部署市场合约”。

### 扣了 MON，但合约广场没显示

交易可能成功了，但事件同步没读回来。处理方式：

1. 点击“同步”。
2. 确认交易发生在最近 100 block 内。
3. 如果仍未显示，使用交易哈希在 explorer 查看事件，或部署 `indexer/` 做完整历史同步。

### `eth_getLogs is limited to a 100 range`

这是 Monad RPC 限制。当前前端已按 100 block 范围查询。生产环境用 Envio indexer。

### Foundry 安装失败

本项目不再依赖 Foundry 完成 demo 部署。前端使用 `solc` 生成 bytecode，并用 MetaMask 直接部署合约。

## Indexer

`indexer/` 包含 Envio HyperIndex-ready 文件。合约部署并验证后，可以按 `indexer/README.md` 初始化/部署。

生产环境建议：

- 用 Envio 同步所有历史事件。
- 前端配置 `NEXT_PUBLIC_INDEXER_GRAPHQL_URL`。
- 合约广场和我的合约优先走 GraphQL，而不是直接扫 RPC logs。

## 合约核心方法

- `registerAsset(assetType, productionMode, priceWei, metadataUri)`
- `publishVersion(assetId, contentHash, uri)`
- `subscribe(assetId)` payable
- `releaseMyEscrow(subscriptionId)`
- `refundFirstTerm(subscriptionId)`
- `submitStructuredFeedback(assetId, score)`

## 项目结构

```text
contracts/          Solidity 市场合约
docs/               PRD
indexer/            Envio indexer 模板
scripts/            合约 artifact 和部署辅助脚本
src/domain/         可测试领域核心
tests/              行为测试
web/                Next.js 前端
```
