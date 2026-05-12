# Submission Checklist

Based on the Notion package rendered on 2026-05-12 and the MOJO showcase format.

## Must Submit On MOJO

- MOJO account has been created and logged in at least once before submission.
- Event registration status is confirmed on MOJO. If Luma registration was used, MOJO should still show the event registration as successful.
- If the event page does not show the team panel after registration/check-in, contact Box or the onsite organizer before waiting until submission time.
- Team is registered on MOJO.
- Team lead is assigned, because only the lead can submit or edit project details.
- Team lead wallet / payout address is decided internally before submission, because awards are paid through the team lead address and Monad does not resolve internal team disputes.
- Project is created before the 6:30 PM deadline.
- Other team changes are finalized before submission, because nobody can join or leave a team after project submission.
- Project detail page has both "查看项目" and "查看源码" links ready.

## Required Assets

- Logo.
- Preview image.
- Concise project introduction.
- Working public preview link.
- Public GitHub link.
- Contract address and Monad explorer link after deployment.

## Project Description Draft

OPC KnoVault 是面向 AI 时代 OPC 的可信知识资产订阅市场。Verified OPC 可以把报告、模板、方法论和数据包发布成可验证资产；买家先看免费预览、验证状态和版本记录，再用 MON 订阅当前有效版本。Monad 负责记录资产存在、版本发布、订阅、结构化反馈、首期托管放款和争议退款事件，完整内容保留在链下。

Demo 闭环：Verified OPC 发布知识资产 → 买家订阅 → Monad 生成订阅/访问记录 → 买家提交结构化反馈 → 平台放款或退款裁决。

## Long Description Draft

AI 时代，一个人可以用知识库、方法论、数据集和 Agent 工作流像公司一样提供商业价值。但这些能力很难被信任、比较、订阅和追踪版本。OPC KnoVault 把 OPC 的可复用知识资产变成可交易商品：平台先验证 OPC，OPC 发布资产页和当前版本，买家用 MON 订阅访问权，平台在 Monad 上留下可信交易事件。

这不是招聘平台，也不是普通外包平台。v1 只交易 Knowledge Asset Subscription，覆盖 Document / Report、Template / Methodology、Dataset / Annotation Pack 三类资产。买家购买的是订阅期内的 Usage Right 和 Content Access，不是所有权或转售权。资产正文、PDF、Markdown 和数据包保存在链下，Monad 只记录验证、资产、版本、订阅、反馈、放款和退款裁决。

商业模式从每笔订阅的 Platform Fee 开始，后续可扩展到 OPC 验证费、资产曝光、买家采购工具和声誉分析。

## Public Availability

- GitHub repository is public.
- Frontend is deployed and publicly reachable.
- Monad testnet contract is deployed and kept available.
- Demo path is stable enough for live review.
- Backup screenshots and screen recording are available if network or wallet UX stalls.

## Demo Readiness

- 5-minute live demo rehearsed.
- Live path starts with the running app, not long slides.
- First screen shows asset page and Monad testnet context.
- Contract lifecycle can be explained in one sentence: verification, asset, version, subscription, feedback, escrow release/refund.
- Backup screenshots prepared.
- Backup screen recording prepared.
- Monad testnet deployment and frontend preview checked before demo.

## Technical Checks

- `cd web && npm run lint`
- `cd web && npm run build`
- `cd contracts && forge build`
- `cd contracts && forge test -vvv`

## Carry / Environment

- Laptop and charger.
- Mouse and headphones.
- Node.js, npm/yarn, Git.
- Foundry.
- Preferred editor.
- Wallet with Monad testnet MON.
- Any expected framework/library installed locally.
