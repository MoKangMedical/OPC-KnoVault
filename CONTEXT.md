# OPC Trust Market

This context defines the language for a marketplace where one-person companies trade verifiable knowledge assets through Monad-backed trust and settlement records.

## Language

**Knowledge Asset**:
A packaged, verifiable unit of expertise or work output that can be listed, traded, and delivered.
_Avoid_: knowledge, content, asset pack

**Usage Right**:
The buyer receives ongoing access to use a Knowledge Asset without owning or redistributing it.
_Avoid_: ownership, transfer, resale right

**Human-authored**:
A Knowledge Asset created primarily by a person without material AI generation.
_Avoid_: manual, purely human

**AI-assisted**:
A Knowledge Asset created by a person with visible AI support in drafting, analysis, or synthesis.
_Avoid_: AI-made, synthetic

**Agent-executed**:
A Knowledge Asset produced by an autonomous agent under a person's intent and oversight.
_Avoid_: bot-made, fully automated

**Document / Report**:
A Knowledge Asset packaged as readable research, analysis, or guidance.
_Avoid_: article, post

**Template / Methodology**:
A Knowledge Asset packaged as a reusable process, framework, or playbook.
_Avoid_: checklist, note

**Dataset / Annotation Pack**:
A Knowledge Asset packaged as structured data with supporting labeling or documentation.
_Avoid_: raw data, dump

**Subscription Access**:
A recurring payment model that grants ongoing access to a Knowledge Asset.
_Avoid_: one-time license, permanent access

**Monad Native Token**:
The chain asset used to settle marketplace subscriptions in v1.
_Avoid_: stablecoin, fiat balance

**Monad Testnet**:
The target network for v1 real wallet transactions and contract events.
_Avoid_: simulated chain, mainnet-first

**Wallet Subscription**:
A buyer-initiated contract call that pays Monad Native Token to subscribe to a Knowledge Asset.
_Avoid_: backend payment, simulated purchase

**Platform Fee**:
The marketplace's percentage cut from each subscription payment.
_Avoid_: commission, take rate

**Content Access**:
A subscription entitlement to read, download, or view a Knowledge Asset without execution or service delivery.
_Avoid_: fulfillment, managed service

**Trust Event**:
A public Monad-recorded event that proves a marketplace action happened.
_Avoid_: content storage, private chat, offchain log

**Verified OPC**:
An OPC approved to publish Knowledge Assets after passing marketplace review.
_Avoid_: unverified creator, open seller

**Verification Pack**:
The minimum evidence required for an OPC to pass review, consisting of a wallet registration, sample work, and a human review.
_Avoid_: KYC, full identity verification

**Portfolio Sample**:
One piece of work that shows what the OPC can produce.
_Avoid_: credential, resume line

**Asset Page**:
The primary listing view for a Knowledge Asset, centered on the asset rather than the creator.
_Avoid_: profile page, personal homepage

**OPC Profile**:
The public page for a Verified OPC, showing trust signals and representative work.
_Avoid_: resume, personal bio page

**Subscribe**:
The primary action that grants a buyer Content Access to a Knowledge Asset.
_Avoid_: purchase, contact, request

**Expired Access**:
A lapsed subscription that preserves listing metadata and purchase history but not the asset body.
_Avoid_: revoked purchase, deleted access

**Active Version**:
The current version of a Knowledge Asset that active subscribers can access.
_Avoid_: latest draft, working copy

**Reputation Event**:
A marketplace-attached signal that records feedback about a Knowledge Asset or OPC.
_Avoid_: rating, testimonial, comment

**Structured Feedback**:
A buyer-provided reputation signal with fixed fields instead of free-form praise alone.
_Avoid_: star rating only, open comment

**First-term Refund**:
A refund option that applies only to the first subscription term when the asset materially mismatches its listing.
_Avoid_: unconditional refund, permanent guarantee

**Platform Review**:
Manual marketplace adjudication of disputes, refunds, and listing compliance.
_Avoid_: court, arbitration network

**Public Registration**:
An account creation mode where anyone can join, but publishing still requires review.
_Avoid_: fully open publishing, closed beta

**Escrow**:
Platform-held funds for the first subscription term until access or refund resolution is decided.
_Avoid_: full custody, permanent holding

**OPC**:
A one-person company or small AI-augmented operator that sells capabilities through the market.
_Avoid_: freelancer, employee, vendor

## Relationships

- An **OPC** can list one or more **Knowledge Assets**
- A **Knowledge Asset** is sold with a **Usage Right**
- A **Usage Right** is recorded through the marketplace's trust layer
- A **Knowledge Asset** can be **Human-authored**, **AI-assisted**, or **Agent-executed**
- A **Knowledge Asset** can be sold as a **Document / Report**, **Template / Methodology**, or **Dataset / Annotation Pack**
- A **Knowledge Asset** is monetized through **Subscription Access**
- v1 trades **Content Access** rather than execution services
- The trust layer records **Subscription Access**, **asset versions**, and **reputation events**
- Only a **Verified OPC** may publish Knowledge Assets in v1
- A **Verified OPC** passes review with a **Verification Pack**
- A **Verification Pack** includes a **Portfolio Sample**
- Subscription settlement uses the **Monad Native Token**
- v1 real transactions target **Monad Testnet**
- A buyer subscribes through a **Wallet Subscription**
- The marketplace is organized around the **Asset Page** rather than the OPC profile
- The primary action on an **Asset Page** is **Subscribe**
- An **OPC Profile** shows verification status, representative work, and reputation summary
- An **Expired Access** keeps metadata visible but removes content body access
- Active subscribers can access the **Active Version** of a Knowledge Asset
- The trust layer records **Reputation Event** data
- Reputation is based mainly on **Structured Feedback**
- A **First-term Refund** is available for material mismatch in the initial subscription period
- The marketplace uses **Platform Review** for disputes
- The marketplace uses **Escrow** for the first subscription term
- The marketplace allows **Public Registration** but requires review before publishing
- The marketplace charges a **Platform Fee** on subscriptions

## Example dialogue

> **Dev:** "If a buyer pays for a **Knowledge Asset**, do they own it?"
> **Domain expert:** "No. They get a **Usage Right** that continues over time, but the asset stays with the **OPC**."

## Flagged ambiguities

- "knowledge" was used to mean both raw information and a packaged tradeable unit - resolved: use **Knowledge Asset** for the tradeable unit.
