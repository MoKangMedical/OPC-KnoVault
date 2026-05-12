# OPC Match MONSKILLS Development Collaboration Guide

版本：v0.1  
日期：2026-05-12  
用途：把 Monad 提供的 MONSKILLS 应用到 OPC Match 黑客松开发协作

## 1. 结论

MONSKILLS 适合被当作团队的 Monad 开发操作手册，而不是单纯的资料链接。

当前项目口径已经从早期 OPC Match 的泛合作意向，收敛为 OneProof Market 的 Knowledge Asset Subscription。OPC Match 保留为上游 AI 发现 / 匹配层，真正可交易闭环是 Verified OPC 发布知识资产，买家订阅，Monad 记录资产、版本、订阅、反馈、托管放款和退款裁决。

在 OPC Match 中，它主要帮助我们把开发拆成四条并行工作线：

- 产品 / 前端线：用 `scaffold` 和 `wallet-integration` 快速搭出 Next.js 产品闭环。
- 合约线：用 `scaffold`、`wallet`、`gas` 设计、部署和验证 Intent Proof 合约。
- 链上数据线：先用合约读取满足 Demo，后续需要活动流或历史记录时再接 `indexer`。
- 部署线：用 `vercel-deploy` 快速生成可访问的 Demo 链接。

推荐协作原则：

前端可以先用 mock contract address 和 mock proof 数据推进页面，但合约部署地址和 ABI 必须尽早交给前端。MONSKILLS 的 scaffold 指南也明确建议先部署合约，再构建依赖合约地址的前端。

当前实现状态：

- `web/` 已完成 Next.js + RainbowKit + Wagmi + viem。
- `web/` 已加入 AI 需求匹配台：机会模板、推荐资产、匹配理由、可信依据、风险提示、合作建议和 intent summary hash。
- `contracts/` 已从 Intent Proof 升级为 `OPCMarket`：OPC verification、asset registration、version publication、subscription escrow、feedback、platform release、refund review。
- `gas` 原则已应用到前端写交易：订阅调用使用显式 gas limit。

## 2. MONSKILLS 安装与使用

官网：

https://skills.devnads.com/

通用安装方式：

```bash
npx skills add therealharpaljadeja/monskills
```

Claude Code 插件方式：

```text
/plugin marketplace add therealharpaljadeja/monskills
/plugin install monskills@monskills
```

如果使用 Codex / Cursor / Claude / Gemini / Copilot 等 Agent，也可以直接让 Agent 读取：

```text
Read skills.devnads.com and help us build OPC Match on Monad.
```

建议团队约定：

- 每个开发任务开始前，先明确要读取哪个 MONSKILLS skill。
- 每个成员在提交或同步时，说明自己依据了哪个 skill。
- 不让 Agent 凭旧知识写 Monad 相关代码，涉及 Monad、Wagmi、gas、部署、合约验证时都先读对应 skill。

## 3. Skill 到任务的映射

| OPC Match 任务 | 应读 MONSKILLS skill | 产出 |
| --- | --- | --- |
| 从 0 搭项目结构 | `scaffold` | `web/`、`contracts/`、可选 `indexer/` 目录 |
| 判断哪些数据上链 | `scaffold` | 链上 / 链下边界文档 |
| 写 Knowledge Asset 订阅合约 | `scaffold`、`gas` | Solidity 合约、测试、gas 约束 |
| 部署合约 | `wallet` | 合约地址、部署交易哈希 |
| 验证合约 | `scaffold` | 多浏览器验证结果 |
| 前端接钱包 | `wallet-integration` | RainbowKit + Wagmi + viem 配置 |
| 前端读写合约 | `wallet-integration`、`gas` | `useReadContract` / 写入订阅交易交互 |
| 估算和展示 gas | `gas` | 明确 gas limit、UI 费用提示 |
| 做证明历史 / 活动流 | `indexer` | 后续阶段索引器，不作为首要 MVP |
| 上线 Demo | `vercel-deploy` | Preview URL 和 Claim URL |
| 解释 Monad 特性 | `concepts`、`why-monad` | Demo 讲解素材 |

新增映射：

| OneProof 任务 | 应读 MONSKILLS skill | 产出 |
| --- | --- | --- |
| AI 机会模板到资产推荐 | `scaffold` | 机会模板、推荐理由、intent summary hash |
| 知识资产订阅交易 | `wallet-integration`、`gas` | `subscribe` 写交易、显式 gas limit、交易哈希 |
| 首期托管与反馈事件 | `scaffold`、`gas` | `submitFeedback`、`approveFirstTerm`、`requestRefund`、`resolveDispute` |

## 4. 推荐仓库结构

```text
OPC Match/
  docs/
    OPC-Match-PRD.md
    MONSKILLS-Development-Collaboration.md
  web/
    app/
    components/
    config/
    lib/
    data/
  contracts/
    src/
    script/
    test/
  indexer/
    # 可选，MVP 后再建
```

说明：

- `web/`：Next.js 前端、页面、钱包连接、AI 匹配展示、合约交互。
- `contracts/`：Foundry 项目，放 Intent Proof 合约。
- `indexer/`：后续如果要做历史证明列表、活动流、排行榜，再接入。

## 5. 开发阶段协作流程

### 5.1 阶段一：架构和边界确认

负责人：产品 / 全员  
建议读取：`scaffold`、`concepts`

目标：

- 确认哪些信息上链，哪些链下保存。
- 确认 MVP 只做 Intent Proof，不做支付托管、仲裁、完整声誉算法。
- 确认合约字段和前端页面字段一致。

OPC Match 当前链上边界：

- 上链：需求方地址、OPC 地址或小队地址、机会 ID、机会类型、匹配资产摘要、预算区间、状态、AI 摘要哈希、时间戳。
- 链下：完整机会描述、AI 推荐解释、报价、沟通、知识库、数据集、详细资产内容。

阶段交付：

- Intent Proof 字段表。
- 页面字段表。
- 合约接口草案。

### 5.2 阶段二：合约优先

负责人：合约同学  
建议读取：`scaffold`、`wallet`、`gas`

目标：

- 建立 `contracts/` Foundry 项目。
- 编写 `IntentProofRegistry` 合约。
- 写最小测试。
- 部署到 Monad testnet。
- 验证合约。
- 把合约地址和 ABI 交给前端。

为什么合约要优先：

- 前端需要真实合约地址和 ABI。
- Demo 的 Web3 闭环依赖真实交易。
- 如果合约晚于前端，会导致最后集成时间被压缩。

合约建议接口：

```solidity
function createIntentProof(
    string calldata opportunityId,
    string calldata opportunityType,
    address[] calldata opcAddresses,
    string calldata assetSummary,
    string calldata budgetRange,
    bytes32 aiSummaryHash
) external returns (uint256 proofId);
```

建议事件：

```solidity
event IntentProofCreated(
    uint256 indexed proofId,
    address indexed requester,
    string opportunityId,
    string opportunityType,
    bytes32 aiSummaryHash,
    uint256 timestamp
);
```

交接给前端的信息：

- `chainId`。
- RPC URL。
- 合约地址。
- ABI。
- 合约验证链接。
- 一笔成功交易哈希。
- 可用测试钱包地址。

### 5.3 阶段三：前端产品闭环

负责人：前端同学  
建议读取：`scaffold`、`wallet-integration`、`gas`

目标：

- 建立 `web/` Next.js 项目。
- 使用 RainbowKit + Wagmi + viem 接入 Monad 和 Monad testnet。
- 把 tsconfig target 改为 `ES2020`，避免 BigInt 报错。
- 完成五个页面：
  - 机会发布页。
  - AI 匹配结果页。
  - OPC 可信档案页。
  - 合作意向确认页。
  - 链上证明结果页。
- 接入合约写入 Intent Proof。
- 展示交易哈希和证明状态。

前端可以先 mock：

- OPC 档案数据。
- 匹配结果。
- AI 推荐解释。
- 历史声誉。

前端必须真实：

- 钱包连接。
- 链切换或链提示。
- 写入 Intent Proof。
- 展示真实交易哈希。

### 5.4 阶段四：AI 匹配体验

负责人：AI / 数据同学  
建议读取：`scaffold`，必要时不依赖 MONSKILLS

目标：

- 准备四类机会模板。
- 准备 Demo 主机会。
- 准备 3 个 OPC 候选人。
- 准备一个 OPC 小队组合。
- 生成匹配解释、风险提示、合作建议、Intent 摘要。

建议实现方式：

- 黑客松版本先规则匹配 + 预置候选。
- LLM 只负责生成解释和摘要，或使用预置文本保证稳定。
- Intent 摘要生成后计算 hash，传给合约。

交付给前端：

- `opportunities.ts`
- `opcProfiles.ts`
- `matchResults.ts`
- `demoScript.ts`

### 5.5 阶段五：部署和演示

负责人：部署 / 全员  
建议读取：`vercel-deploy`

目标：

- 前端项目增加 `vercel.json`。
- 部署 Vercel Preview。
- 保留 Claim URL。
- 准备备用 Demo 数据和备用交易哈希。

上线前检查：

- 所有必要文件已加入 git。
- 前端环境变量齐全。
- 合约地址正确。
- 钱包能连接 Monad testnet。
- 写入交易至少成功一次。
- Demo 页面可在投影环境清楚展示。

## 6. 任务拆分建议

### 6.1 三人团队

成员 A：前端与 Demo 叙事

- 负责 `web/`。
- 页面、交互、钱包连接、Demo 流程。
- 读取 `wallet-integration`、`vercel-deploy`。

成员 B：合约与链上证明

- 负责 `contracts/`。
- Intent Proof 合约、部署、验证、交易哈希。
- 读取 `scaffold`、`wallet`、`gas`。

成员 C：AI 匹配与数据

- 负责机会模板、OPC 数据、匹配解释、合作摘要。
- 和前端约定数据结构。
- 和合约同学约定 hash 内容。

### 6.2 两人团队

成员 A：前端 + AI 数据

- 先完成页面和 mock 数据。
- 后接钱包与合约。

成员 B：合约 + 部署

- 先完成合约部署和 ABI。
- 再协助前端接入交易。

## 7. 建议的黑客松执行顺序

### 第 0 小时：开工前 15 分钟

- 全员读本协作指南。
- 明确合约字段。
- 明确页面顺序。
- 明确 Demo 主线只跑 Web3 中国市场进入。

### 第 1 小时：骨架先行

- 前端搭出页面路由和静态数据。
- 合约搭出 Foundry 项目和合约草案。
- AI 数据准备 Demo 主机会和 OPC 候选。

### 第 2 小时：并行推进

- 前端完成机会发布、匹配结果、档案页。
- 合约完成测试和部署。
- AI 数据完成推荐解释和 Intent 摘要。

### 第 3 小时：第一次集成

- 合约交付地址和 ABI。
- 前端接入钱包和合约写入。
- 打通一笔真实交易。

### 第 4 小时：打磨 Demo

- 完成合作意向确认页和证明结果页。
- 准备备用交易哈希。
- 优化 Monad 价值表达。

### 第 5 小时：部署

- 跑 build。
- 部署 Vercel Preview。
- 用真实钱包走一次完整 Demo。

### 第 6 小时：彩排

- 控制 Demo 在 4 到 5 分钟。
- 记录失败备用方案。
- 准备一句话定位和收尾话术。

## 8. 关键注意事项

### 8.1 不要把所有内容都上链

MONSKILLS scaffold 的判断原则很适合 OPC Match：

- 需要可信承诺、所有权、证明、组合性的内容上链。
- 用户资料、搜索、排序、详细商业内容、知识库原文、数据集内容放链下。

### 8.2 Gas limit 要谨慎

MONSKILLS gas 指南强调 Monad 按 gas limit 收费，而不是按实际 gas used 收费。

对 OPC Match 的影响：

- 前端不要设置过高 gas limit。
- 合约函数保持简单，避免复杂数组和大量冷存储读取。
- UI 展示 gas 费用时按 gas limit 计算。

### 8.3 前端 tsconfig 需要 ES2020

Wagmi / viem 会大量使用 BigInt。创建 Next.js 项目后要立刻把 `tsconfig.json` 的 target 改为 `ES2020`。

### 8.4 不要现场临时学合约验证

scaffold 指南建议部署后用验证 API 一次验证多个浏览器。合约同学需要提前把验证步骤跑通，至少保留一个已验证合约链接。

### 8.5 Indexer 不进首版关键路径

OPC Match 未来需要证明历史、活动流、声誉记录，这时候适合接 `indexer`。但黑客松 MVP 只需要展示刚刚写入的 Proof，可以先通过交易回执和合约读取解决。

备注：MONSKILLS 总入口列出了 `indexer` skill；我本地直拉 `https://skills.devnads.com/indexer/SKILL.md` 时返回 `Skill not found`。如果后续确实要做索引器，先从 MONSKILLS 首页或 GitHub 仓库确认最新路径。

## 9. 给协作者的 Agent Prompt 模板

### 9.1 合约同学

```text
Read https://skills.devnads.com/SKILL.md, then fetch scaffold, wallet, and gas skills.
We are building OPC Match on Monad. Implement a Foundry contract named IntentProofRegistry for recording collaboration intent proofs.
Use a minimal, gas-conscious design. Emit IntentProofCreated. After implementation, deploy to Monad testnet, verify the contract, and return address, ABI, tx hash, and explorer link.
```

### 9.2 前端同学

```text
Read https://skills.devnads.com/SKILL.md, then fetch scaffold and wallet-integration skills.
Build the OPC Match web app in Next.js with RainbowKit, Wagmi, and viem on Monad testnet.
Implement five screens: opportunity publish, AI matches, OPC profile, intent review, proof result.
Use mock OPC data first, then wire the IntentProofRegistry contract once address and ABI are available.
```

### 9.3 AI / 数据同学

```text
Build demo data for OPC Match.
Main scenario: a Monad ecosystem project entering China / Shanghai market.
Create opportunity template data, 3 OPC profiles, 1 recommended OPC pod, matching reasons, risk notes, collaboration suggestions, and an intent summary suitable for hashing and recording onchain.
```

### 9.4 部署同学

```text
Read https://skills.devnads.com/vercel-deploy/SKILL.md.
Prepare the OPC Match web app for Vercel deployment.
Ensure vercel.json exists, environment variables are documented, all required files are tracked by git, and return Preview URL plus Claim URL.
```

## 10. 对 PRD 的补充建议

可以在 PRD 中增加一句开发策略：

OPC Match 将采用 MONSKILLS 作为 Monad 开发协作手册：用 scaffold 确定链上 / 链下边界，用 wallet-integration 快速接入钱包，用 wallet 部署合约，用 gas 约束交易成本，用 vercel-deploy 快速交付可访问 Demo。

## 11. 参考链接

- MONSKILLS 官网：https://skills.devnads.com/
- MONSKILLS 总入口：https://skills.devnads.com/SKILL.md
- Scaffold：https://skills.devnads.com/scaffold/SKILL.md
- Wallet Integration：https://skills.devnads.com/wallet-integration/SKILL.md
- Gas：https://skills.devnads.com/gas/SKILL.md
- Wallet：https://skills.devnads.com/wallet/SKILL.md
- Concepts：https://skills.devnads.com/concepts/SKILL.md
- Vercel Deploy：https://skills.devnads.com/vercel-deploy/SKILL.md
