# Cohesora — Evidence-Led Brand Governance Platform

<p align="center">
  <img src="docs/assets/cohesora-banner.svg" alt="Cohesora — Evidence-Led Brand Governance Platform" width="100%" />
</p>

<p align="center">
  <strong>"Evidence Before Enforcement."</strong><br>
  An enterprise-grade brand governance and creative review platform engineered to ensure digital marketing copy, visual creatives, and promotional campaigns strictly conform to approved brand rules, legal disclaimers, promotional constraints, and accessibility standards prior to publication.
</p>

<p align="center">
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-18%2B%20%7C%2020%2B%20%7C%2022%20LTS-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js 18+ | 20+ | 22 LTS" /></a>
  <a href="https://expressjs.com"><img src="https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express&logoColor=white" alt="Express 4.21" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 18.3" /></a>
  <a href="https://vite.dev"><img src="https://img.shields.io/badge/Vite-6.1-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 6.1" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="TailwindCSS 3.4" /></a>
  <a href="#verification--benchmark-results"><img src="https://img.shields.io/badge/Tests-39%20Passed%20(100%25)-10B981?style=flat-square&logo=checkmarx&logoColor=white" alt="Tests 39 Passed (100%)" /></a>
  <a href="#25-case-golden-evaluation-benchmark"><img src="https://img.shields.io/badge/Golden%20Benchmark-100%25%20Recall-F59E0B?style=flat-square&logo=speedtest&logoColor=white" alt="Golden Benchmark 100% Recall" /></a>
  <a href="https://www.w3.org/WAI/standards-guidelines/wcag/"><img src="https://img.shields.io/badge/WCAG-2.2%20AA%2FAAA-4F46E5?style=flat-square&logo=w3c&logoColor=white" alt="WCAG 2.2 AA/AAA" /></a>
  <a href="#authorship--license"><img src="https://img.shields.io/badge/License-UNLICENSED-slate?style=flat-square" alt="License UNLICENSED" /></a>
</p>

<p align="center">
  <a href="https://codex-48.vercel.app"><strong>🚀 Live Web Application</strong></a> &bull;
  <a href="https://codex-48.onrender.com"><strong>🔌 Live REST API</strong></a> &bull;
  <a href="docs/api.md"><strong>📖 API Reference Blueprint</strong></a> &bull;
  <a href="workflows.md"><strong>📋 Product Specification</strong></a> &bull;
  <a href="#verification--benchmark-results"><strong>🧪 Benchmark Results</strong></a>
</p>

> **🏆 We Code Coders Hackathon | Inkloom AI — Brand Governance Platform**  
> **Team Name**: BroCode &bull; **Participant**: Rajat Aggarwal (*National Institute of Technology, Hamirpur*)  
> **Role / Contribution**: Sole Designer & Developer across all four engineering workstreams (Backend, AI/Visual Engine, Frontend UI, Evaluation/Deployment)  
> **Submission Document**: Round 1 Submission | The Plan (8-Page Official Architecture & Execution Benchmark)

---

## 🎯 Hackathon Proposal Alignment & Verification Matrix

Every single principle, architectural layer, named improvement, and concrete walkthrough outlined in the **Round 1 Submission Plan** has been fully implemented, integrated, and verified in this codebase:

| Proposal Section | Specified Requirement | Codebase Implementation & Verification Status |
| :--- | :--- | :---: |
| **Sec 1.2: Problem Boundary** | Evidence-based pre-publication quality-control layer; versioned rule grounding. | ✅ **Active** &bull; Rules snapshot at intake; deterministic + AI verification. |
| **Sec 2.1: Target Personas** | Creator, Reviewer, Admin, Agency, Compliance roles with explicit permissions. | ✅ **Active** &bull; Server-side RBAC; interactive role view switcher in navbar. |
| **Sec 3.1: 7 Core Capabilities** | (A) Brand Registry, (B) Hybrid Engine, (C) Explainable Findings, (D) 3-State Classification, (E) Human Approval, (F) Governance Insights, (G) WCAG Visual/OCR. | ✅ **Active** &bull; 100% covered across `apps/web` and `apps/api`. |
| **Sec 3.2: 5 Originality Points** | Evidence-linked claims, time-aware dates, guideline clarity loop, separated deterministic checks, reproducible snapshots. | ✅ **Active** &bull; Independent rule citation checking, append-only `AuditEvent`. |
| **Sec 4.1: 8-Step Workflow** | Configure Registry ➔ Submit Content ➔ Snapshot Rules ➔ Hybrid Review ➔ Evidence Validation ➔ Revise ➔ Human Decision ➔ Audit Logging. | ✅ **Active** &bull; Complete operational flow in `reviewWorker.js` & `SubmissionsPage.jsx`. |
| **Sec 4.2: Walkthrough 1** | Social Caption: *"Enjoy free shipping on every order!"* vs **Policy PR-104 (v1.2)** (min INR 999). | ✅ **Verified** &bull; 1-click in `JudgeDemoModal.jsx` (Scenario 1) & test `BM-01`. |
| **Sec 4.2: Walkthrough 2** | Static Campaign Poster: Pale-yellow (`#FFF3B0`) on white (`#FFFFFF`) (contrast 1.12:1) + missing alt-text. | ✅ **Verified** &bull; 1-click in `JudgeDemoModal.jsx` (Scenario 2) & test `BM-06`. |
| **Sec 5.1: Named Improvement 1** | **Multi-Format Document Support (PDF & DOCX)**: Extract text/headings, convert to candidate rules. | ✅ **Active** &bull; Native `pdfjs-dist` & `mammoth` parser on `/brief-imports` tab. |
| **Sec 5.1: Named Improvement 2** | **Automated Rule Conflict Detection on Import**: Detect contradictory terms, date overlaps, duplicate rules. | ✅ **Active** &bull; Live conflict detector in `conflictDetector.js` & `RulesPage.jsx`. |
| **Sec 5.1: Named Improvement 3** | **Side-by-Side Visual & Text Revision Diffing**: Word-level diff, contrast delta ($+13.10:1$), resolution breakdown. | ✅ **Active** &bull; Implemented in `RevisionDiffView.jsx` with visual contrast delta. |
| **Sec 5.2: Responsible AI** | API keys on server, zero AI auto-approval, fallback to `INCOMPLETE` if LLM/OCR fails. | ✅ **Enforced** &bull; Human-in-the-loop state machine; failsafe diagnostics. |
| **Sec 6.1: 3-Layer Architecture** | Layer 1 (Deterministic/WCAG) ➔ Layer 2 (Gemini Flash) ➔ Layer 3 (Server Verification & Human Sign-off). | ✅ **Active** &bull; Documented in system architecture diagram. |
| **Sec 8.1: 25-Case Benchmark** | Curated 25-case demonstration set ($12$ TP, $5$ TN, $5$ Unverified/Advisory, $3$ Robustness). | ✅ **Passed 100%** &bull; Executed via `npm run test:benchmark` (Target: $\ge 95\%$). |

---

## 📑 Table of Contents

- [Executive Summary](#executive-summary)
  - [The Problem Statement](#the-problem-statement)
  - [The Cohesora Solution: Evidence Before Enforcement](#the-cohesora-solution-evidence-before-enforcement)
  - [User Personas & Value Proposition](#user-personas--value-proposition)
- [Key Features & Named Improvements](#key-features--named-improvements)
  - [1. Multi-Format Brief Document Parsing *(Named Improvement 1)*](#1-multi-format-brief-document-parsing-named-improvement-1)
  - [2. Automated Rule Conflict Detection on Import *(Named Improvement 2)*](#2-automated-rule-conflict-detection-on-import-named-improvement-2)
  - [3. Side-by-Side Visual & Text Revision Diffing *(Named Improvement 3)*](#3-side-by-side-visual--text-revision-diffing-named-improvement-3)
  - [4. Deterministic Review & Compliance Engine](#4-deterministic-review--compliance-engine)
  - [5. Server-Side Evidence Citation Validation](#5-server-side-evidence-citation-validation)
  - [6. Immutable Audit Log & Governance Insights](#6-immutable-audit-log--governance-insights)
  - [7. Interactive Guided Onboarding Tour](#7-interactive-guided-onboarding-tour)
  - [8. 1-Click Judge Showcase Demo](#8-1-click-judge-showcase-demo)
  - [9. Concurrency & State Integrity Shield](#9-concurrency--state-integrity-shield)
  - [10. Transparent Session Recovery & Cloud Cold-Start Resilience](#10-transparent-session-recovery--cloud-cold-start-resilience)
- [Application Visual Showcase](#application-visual-showcase)
- [Architecture & System Design](#architecture--system-design)
  - [System Component Architecture](#system-component-architecture)
  - [End-to-End Review Workflow Pipeline](#end-to-end-review-workflow-pipeline)
  - [Data Model & Entity Relationships](#data-model--entity-relationships)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites & Quickstart](#prerequisites--quickstart)
  - [Prerequisites](#prerequisites)
  - [Step 1: Clone Repository & Install Dependencies](#step-1-clone-repository--install-dependencies)
  - [Step 2: Environment Configuration](#step-2-environment-configuration)
  - [Step 3: Launch in Development Mode](#step-3-launch-in-development-mode)
  - [Step 4: Build for Production](#step-4-build-for-production)
- [Environment Variables & Configuration](#environment-variables--configuration)
- [API Reference Summary](#api-reference-summary)
- [Security & Responsible AI Engineering](#security--responsible-ai-engineering)
- [Verification & Benchmark Results](#verification--benchmark-results)
  - [Automated Test Suites (39 / 39 Passed)](#automated-test-suites-39--39-passed)
  - [25-Case Golden Evaluation Benchmark](#25-case-golden-evaluation-benchmark)
- [Production Deployment](#production-deployment)
- [Roadmap & Planned Enhancements](#roadmap--planned-enhancements)
- [Known Limitations](#known-limitations)
- [Authorship & License](#authorship--license)

---

## 💡 Executive Summary

### The Problem Statement

Modern brand marketing moves fast across social media, email campaigns, display advertisements, and external agency partnerships. Brand guidelines, product claims, seasonal promotional rules, mandatory legal disclaimers, and accessibility constraints are frequently scattered across static PDFs, intranet portals, and shared spreadsheets.

This operational fragmentation results in five persistent challenges:

1. **Fragmented Sources of Truth**: Copywriters and design agencies operate against superseded guidelines or outdated promotional terms.
2. **Unsupported Promotional Claims**: Copy often promises discounts, delivery terms, or guarantees that lack approved commercial or legal clearance.
3. **Inconsistent Terminology & Disclaimers**: Content may sound compelling, yet breach prohibited term policies (e.g., superlative claims like *"cheapest"*) or omit mandatory legal disclaimers (e.g., missing `*T&C apply`).
4. **Visual & Accessibility Failures**: Creative graphics frequently suffer from unreadable text with poor WCAG contrast ratios or off-brand color schemes.
5. **Subjective, Action-Deficient Feedback**: Review cycles stall on vague feedback like *"doesn't feel on-brand"* without specific rule citations or actionable corrections.

### The Cohesora Solution: Evidence Before Enforcement

Cohesora introduces a foundational shift: **no claim is approved simply because it sounds convincing, and no violation is penalized without an explicit rule citation.**

```
Traditional Workflow: Content Intake ──> Vague Human / LLM Opinion ──> Fragmented Edits ──> Compliance Risk
Cohesora Workflow:    Content Intake ──> Frozen Snapshot ──> Deterministic + AI Citation ──> Traceable Audit ──> Human Clearance
```

- **Frozen Rule Snapshots**: At the moment of submission intake, Cohesora freezes an immutable snapshot of all active workspace rules. Future rule updates cannot retroactively fail historic reviews.
- **Deterministic-First Validation**: Explicit promotional thresholds (e.g., minimum spend requirements), prohibited terms, required disclaimers, and WCAG contrast calculations are enforced mathematically and deterministically—not delegated to non-deterministic LLM guessing.
- **Evidence-Linked AI Analysis**: Gemini Flash assists with tone, contextual interpretation, and rewrite suggestions, but server-side validators verify every finding against the frozen rule snapshot. Any unsupported claim is categorized as `NEEDS_VERIFICATION`.
- **Zero AI Auto-Approval**: AI and OCR engines **never** approve or publish content autonomously. The platform strictly enforces human reviewer approval prior to campaign clearance.
- **Zero-Dependency Fallback**: The backend includes an embedded in-memory MongoDB store matching Mongoose query semantics. The entire platform, API, and test suite execute without external database installations.

### User Personas & Value Proposition

| Persona | Core Responsibilities | Cohesora Value Proposition |
| :--- | :--- | :--- |
| **Creator / Copywriter** | Submitting campaign copy, banners, and revisions | Instant automated pre-screening; clear, intent-preserving rewrite suggestions; unambiguous rule explanations. |
| **Reviewer / Compliance Officer** | Reviewing findings, approving campaigns, overriding false alarms | Traceable evidence citations; single-click finding overrides with mandatory audit justifications; side-by-side diff views. |
| **Brand Administrator** | Managing brand guidelines, setting disclaimers, monitoring SLAs | Versioned rule management; automated conflict detection on rule import; real-time governance and SLA bottleneck analytics. |

---

## 🚀 Key Features & Named Improvements

### 1. Multi-Format Brief Document Parsing *(Named Improvement 1)*
- **Native Document Ingestion**: Ingests PDF and DOCX campaign briefs and policy manuals directly using pure JavaScript engines (`pdfjs-dist` and `mammoth`) without external binary dependencies.
- **Structural Extraction**: Automatically parses document headings, bullet points, disclaimers, and candidate rule clauses into structured text streams.
- **Candidate Rule Conversion**: Empowers administrators to convert extracted policy clauses into versioned Brand Rules in draft status with single-click conversion.

### 2. Automated Rule Conflict Detection on Import *(Named Improvement 2)*
- **Proactive Conflict Prevention**: Analyzes candidate rules before activation against all currently active workspace rules to prevent policy deadlocks.
- **Multi-Vector Conflict Checking**:
  - *Prohibited Term Conflicts*: Detects candidate rules requiring terms that active rules prohibit.
  - *Threshold Incompatibilities*: Identifies overlapping campaigns with conflicting promotional numbers (e.g., an active rule requiring INR 999 free shipping vs a new candidate allowing INR 499 in the same date window).
  - *Contradictory Requirements*: Flags rules that prohibit terms explicitly required by existing brand guidelines.
  - *Duplicate Detection*: Catches verbatim duplicate rule statements.

### 3. Side-by-Side Visual & Text Revision Diffing *(Named Improvement 3)*
- **Word-Level Highlighting**: Computes unified word additions (highlighted green) and deletions (red strike-through) between Revision $N$ and Revision $N+1$.
- **Measurable Visual Delta**: Calculates quantitative shifts in WCAG contrast ratios (e.g., tracking an illegible 1.12:1 contrast ratio improving to a compliant 14.22:1 ratio, showing $+13.10:1$ gain).
- **Finding Resolution Matrix**: Automatically classifies findings across revisions as `RESOLVED`, `PERSISTING`, or `NEW`.

### 4. Deterministic Review & Compliance Engine
- **Promotional Rule PR-104 Enforcement**: Enforces that any free shipping promotion must explicitly stipulate a minimum order spend of INR 999 or higher (`minimumExclusive: 999`).
- **Prohibited Superlatives & Terminology**: Catches unapproved words (e.g., *"cheapest"*, *"100% risk-free"*, *"guaranteed results"*) with word boundary and punctuation normalization.
- **Mandatory Legal Riders**: Validates the presence of required disclaimers (e.g., `*T&C apply`).
- **Mathematical Color Science**: Implements strict sRGB relative luminance, WCAG 2.2 contrast ratios (4.5:1 AA / 7.0:1 AAA), and CIEDE2000 $\Delta E_{00}$ color distance metrics.

### 5. Server-Side Evidence Citation Validation
- **Three-State Finding Taxonomy**:
  - `CONFIRMED_RULE_CONFLICT`: A deterministic rule or verified brand policy has been breached.
  - `NEEDS_VERIFICATION`: A factual claim or promotional promise was made that lacks an active citation in the Brand Knowledge Registry.
  - `ADVISORY_STYLE_VISUAL_CONCERN`: Non-blocking recommendations regarding tone, styling, or contrast improvements.
- **Anti-Hallucination Guard**: External LLM outputs are stripped if their citations do not match an existing rule ID in the frozen snapshot.
- **Fail-Safe INCOMPLETE State**: If external AI or OCR services time out or experience network failures, deterministic checks still run and the review is safely marked `INCOMPLETE`—never silently marked compliant.

### 6. Immutable Audit Log & Governance Insights
- **Append-Only Event Ledger**: Every intake, snapshot attachment, review run, human finding override, decision, and revision is recorded with actor ID, timestamp, and metadata.
- **Mandatory Override Justifications**: Overriding any automated finding requires a mandatory, substantive justification ($\ge 5$ characters) that is permanently audited.
- **Governance Insights**: Real-time workspace analytics tracking approval rates, first-time-right percentages, review turnaround SLAs, top triggered rules, and policy exception hotspots.

### 7. Interactive Guided Onboarding Tour
- **10-Step Interactive Walkthrough**: Built into the frontend via [`OnboardingTour.jsx`](apps/web/src/components/OnboardingTour.jsx), guiding new users and evaluators through the entire 8-step operational workflow from Section 4.1 of the proposal:
  1. Welcome & Brand Governance Philosophy
  2. Workspace Overview & Intake Channels
  3. Brand Knowledge Registry (Consolidated Rules)
  4. Rule Sources, Versions & Validity Windows
  5. Multi-Format Brief Document Ingestion (*Named Improvement 1*)
  6. Submitting Creative Content (Copy & Visual Assets)
  7. Campaign & Channel Context Filtering
  8. 1-Click Judge Demonstration Scenarios
  9. Automated Rule Checks, Visual WCAG & AI Suggestions
  10. Governance Insights, SLAs & High-Override Analytics

### 8. 1-Click Judge Showcase Demo
- **Evaluator Test Harness**: Integrated modal [`JudgeDemoModal.jsx`](apps/web/src/components/JudgeDemoModal.jsx) allowing evaluators to execute end-to-end hackathon scenarios (PR-104 violation, revision correction, and conflict detection) in a single click with pre-populated test data.

---

## 📸 Application Visual Showcase

All screenshots below represent the genuine, running Cohesora interface captured during live platform operation.

### 1. Reviews Dashboard
The operational hub for campaign intakes, showing active submissions, governance statuses (`APPROVED`, `CHANGES_REQUESTED`, `PENDING_REVIEW`, `DRAFT`), and fast filtering.

![Cohesora Reviews Dashboard](docs/assets/screenshots/01-reviews-dashboard.png)

---

### 2. Brand Knowledge Registry
The centralized registry for versioned brand rules, promotional conditions (including PR-104), WCAG color parameters, and approved source citations.

![Cohesora Brand Rules Registry](docs/assets/screenshots/02-brand-rules.png)

---

### 3. Multi-Format Brief Document Parser *(Named Improvement 1)*
Extracts policy statements, headings, and promotional tables from uploaded PDF and DOCX briefs, enabling direct conversion into draft brand rules.

![Cohesora Multi-Format Brief Imports](docs/assets/screenshots/03-brief-imports.png)

---

### 4. Governance Analytics & SLA Insights
Workspace-wide compliance analytics displaying overall approval rates, review SLA turnaround metrics, first-time-right compliance, and rule violation frequencies.

![Cohesora Governance Analytics](docs/assets/screenshots/04-insights-analytics.png)

---

### 5. Evidence-Linked Review Findings & Overrides
Detailed review breakdown showing frozen rule snapshot citations, multi-class finding classifications (`CONFIRMED_RULE_CONFLICT`, `NEEDS_VERIFICATION`), and intent-preserving rewrite suggestions.

![Cohesora Review Findings Detail](docs/assets/screenshots/05-review-findings-detail.png)

---

### 6. Side-by-Side Revision Diff View *(Named Improvement 3)*
Word-level revision diffing with measurable WCAG visual contrast improvements and finding resolution tracking across campaign iterations.

![Cohesora Side-by-Side Revision Diff](docs/assets/screenshots/06-revision-diff-view.png)

---

### 7. 1-Click Judge Showcase Demo
Interactive test harness allowing evaluators to execute end-to-end hackathon scenarios (PR-104 violation, revision correction, and conflict detection) in a single click.

![Cohesora Judge Demo Modal](docs/assets/screenshots/07-judge-demo-showcase.png)

---

### 8. Concurrency & State Integrity Shield
Enterprise brand governance requires absolute state integrity between asynchronous automated background scanners and human reviewer actions. Cohesora incorporates a dual-tier concurrency shield:
- **Authoritative Reviewer Precedence**: Human reviewer decisions (`APPROVED`, `REJECTED`, `CHANGES_REQUESTED`) strictly override automated scanner fallback states (`INCOMPLETE`, `REVIEW_READY`).
- **Pre-Write Fresh State Re-Verification**: `ReviewOrchestrator.executeReview` re-queries latest database documents before writing scan results, preventing asynchronous OCR or Gemini evaluations from overwriting concurrent reviewer decisions.
- **Queue Draining on Decision**: Recording a human decision immediately settles and completes queued `ProcessingJob` records, preventing worker loop collisions.
- **Dual-Source Status Synchronization**: Submissions filtering, card badges, and pipeline analytics across `SubmissionsPage`, `ReviewDetailPage`, and `InsightsPage` resolve effective status from both decision records and status flags.

---

### 9. Transparent Session Recovery & Cloud Cold-Start Resilience
Designed for zero-downtime evaluator experiences on free-tier cloud environments:
- **Cloud Cold-Start Adaptive Timeouts**: Replaces aggressive short timeouts with an 18–25s adaptive window accommodating server spin-ups without wiping valid login sessions.
- **Global Session-Expired Event Bus**: When access tokens expire and cannot be refreshed, `ApiClient` emits a global `cohesora:session-expired` event that triggers a clean logout instead of trapping the user in a broken UI state.
- **Evaluator Session Redundancy**: Demo evaluator sessions automatically bind to validated database entities, preventing mock `CastError` failures or 401 Unauthorized states.
- **Self-Healing Startup Sync**: Background startup routines automatically heal any legacy mismatched status documents upon database connection.

---

## 🏛️ Architecture & System Design

### System Component Architecture

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (Web Application)"]
        UI["React 18 + Vite SPA"]
        Tour["Interactive Onboarding Tour"]
        JudgeModal["1-Click Judge Demo Modal"]
        Cache["Stale-While-Revalidate (SWR) Client Cache"]
        Router["Dynamic Role & Tab Router"]
        UI --> Tour
        UI --> JudgeModal
        UI --> Cache --> Router
    end

    subgraph ApiGateway ["API Gateway & Security Middleware"]
        Express["Express 4 REST Server (/api/v1)"]
        AuthGuard["JWT Authentication Guard"]
        RoleGuard["Role-Based Access Control (RBAC)"]
        TenantGuard["Workspace Isolation Guard"]
        UploadGuard["Magic-Byte File Upload Guard"]
        RateLimiter["IP & Route Rate Limiter"]
        Router -->|HTTPS / Bearer JWT| Express
        Express --> RateLimiter --> AuthGuard --> RoleGuard --> TenantGuard --> UploadGuard
    end

    subgraph CoreEngine ["Review Orchestration & Compliance Engines"]
        Orchestrator["Review Orchestrator"]
        Snapshot["Frozen Rule Snapshot Engine"]
        DetEngine["Deterministic Rule Engine\n- PR-104 Promo Threshold\n- Prohibited Terminology\n- Mandatory Disclaimers"]
        VisualEngine["Visual & Accessibility Engine\n- WCAG 2.2 Contrast (sRGB)\n- CIEDE2000 Delta E\n- Local OCR (Tesseract.js)"]
        AIAdapter["Gemini Flash Adapter\n- Semantic Analysis\n- Citation Integrity Validator"]
        ConflictDetector["Automated Rule Conflict Detector (NI 2)"]
        BriefParser["Brief Parser: pdfjs-dist & mammoth (NI 1)"]
        DiffService["Revision Diff Service (NI 3)"]
        
        UploadGuard --> Orchestrator
        Orchestrator --> Snapshot
        Snapshot --> DetEngine
        Snapshot --> VisualEngine
        Snapshot --> AIAdapter
    end

    subgraph DataLayer ["Data & Persistence Layer"]
        Mongo["MongoDB Atlas (Primary Store)"]
        MemFallback["Embedded In-Memory Store (Zero-Dependency Fallback)"]
        AuditStore["Immutable Append-Only Audit Log"]
        FileStorage["Private Hashed Storage (/private-uploads)"]
        
        Orchestrator --> AuditStore
        DetEngine --> Mongo
        DetEngine -.->|Fallback on connection failure| MemFallback
        UploadGuard --> FileStorage
    end
```

### End-to-End Review Workflow Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Creator as Creator / Agency
    participant Client as Web App (React)
    participant API as Express API (/api/v1)
    participant Orch as Review Orchestrator
    participant Det as Deterministic Engine
    participant AI as Gemini Flash Adapter
    actor Reviewer as Human Reviewer

    Creator->>Client: Submit copy or static image creative
    Client->>API: POST /workspaces/:id/submissions
    API->>Orch: Trigger review pipeline
    Note over Orch: Freeze active rules snapshot
    par Deterministic Evaluation
        Orch->>Det: Run PR-104, terminology & WCAG checks
        Det-->>Orch: Return confirmed conflicts & visual findings
    and Semantic Evaluation
        Orch->>AI: Request semantic review & suggestions
        AI-->>Orch: Return findings with citations
        Note over Orch: Server validates citations against snapshot
    end
    Orch->>API: Compile multi-class findings
    API->>API: Record SUBMISSION_REVIEWED in audit log
    API-->>Client: Return review results (Status: PENDING_REVIEW)
    Note over Client: Zero AI Auto-Approval: Human decision required
    Reviewer->>Client: Inspect findings & contrast metrics
    alt Approve Submission
        Reviewer->>API: POST /decisions (Status: APPROVED)
    else Request Revision
        Reviewer->>API: POST /decisions (Status: CHANGES_REQUESTED)
        Creator->>Client: Submit updated revision
        Client->>API: POST /submissions/:id/revisions
        Note over Client: Side-by-side diff compares revisions (NI 3)
    end
```

### Data Model & Entity Relationships

```mermaid
erDiagram
    WORKSPACE ||--o{ WORKSPACE_MEMBER : has
    USER ||--o{ WORKSPACE_MEMBER : joins
    WORKSPACE ||--o{ BRAND_RULE : defines
    WORKSPACE ||--o{ SUBMISSION : owns
    WORKSPACE ||--o{ AUDIT_EVENT : records
    WORKSPACE ||--o{ BRIEF_IMPORT : parses
    SUBMISSION ||--o{ REVISION : contains
    REVISION ||--o{ FINDING : produces
    REVISION }o--|| BRAND_RULE : snapshots

    WORKSPACE {
        string id PK
        string name
        string slug
        object settings
    }

    USER {
        string id PK
        string email
        string displayName
        string passwordHash
        string status
    }

    WORKSPACE_MEMBER {
        string id PK
        string workspaceId FK
        string userId FK
        string[] roles
        string status
    }

    BRAND_RULE {
        string id PK
        string ruleId "e.g., PR-104"
        string version
        string category
        string severity
        string ruleText
        object ruleConfig
        string status "draft | approved | active"
    }

    SUBMISSION {
        string id PK
        string workspaceId FK
        string campaignId
        string channel
        string status "PENDING_REVIEW | APPROVED | CHANGES_REQUESTED"
        string currentRevisionId
    }

    REVISION {
        string id PK
        string submissionId FK
        int revisionNumber
        string copyText
        string assetPath
        object ruleSnapshot
        object metrics
    }

    FINDING {
        string id PK
        string revisionId FK
        string ruleId FK
        string classification "CONFIRMED_RULE_CONFLICT | NEEDS_VERIFICATION | ADVISORY"
        string message
        string status "ACTIVE | OVERRIDDEN"
        string overrideReason
    }

    AUDIT_EVENT {
        string id PK
        string workspaceId FK
        string actorId FK
        string action "e.g., SUBMISSION_CREATED, DECISION_SUBMITTED"
        string entityType
        string entityId
        object metadata
        timestamp createdAt
    }

    BRIEF_IMPORT {
        string id PK
        string workspaceId FK
        string fileName
        string fileType "pdf | docx"
        int candidateCount
        object[] extractedCandidates
    }
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose & Architectural Justification |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18.3** | Component-driven, responsive user interface with optimistic rendering. |
| **Build Tool** | **Vite 6.1** | Sub-second Hot Module Replacement (HMR) and optimized Rollup production bundling. |
| **Styling & Design System** | **Tailwind CSS 3.4** | Utility-first CSS configured with custom brand tokens (Deep Navy `#0B1E36`, Gold `#F59E0B`, Blue `#0055D4`). |
| **Icons** | **Lucide React** | Consistent, accessible iconography across all dashboards. |
| **Backend Runtime** | **Node.js (ESM)** | Event-driven, asynchronous I/O with native ES Module imports (`type: "module"`). |
| **API Framework** | **Express 4.21** | Lightweight REST routing, middleware orchestration, and centralized error handling. |
| **Database & ODM** | **Mongoose 8.9 / MongoDB** | Document-oriented persistence with schema validation for versioned rules and submissions. |
| **Fallback Document Store** | **In-Memory Store** | Custom pure in-memory document store matching Mongoose query semantics, ensuring zero-dependency local and test execution. |
| **AI Integration** | **Google Gemini Flash** | Semantic analysis, contextual tone checks, and intent-preserving rewrite generation. |
| **OCR & Image Processing** | **Sharp & Tesseract.js** | Native image metadata inspection, pixel buffer contrast calculations, and local OCR extraction. |
| **Document Parsers** | **pdfjs-dist & mammoth** | Pure JavaScript extraction of text and headings from PDF and DOCX brief files without legacy binary dependencies. |
| **Security & Auth** | **JWT & bcryptjs** | Stateless JSON Web Token authentication with bcrypt password hashing (10 salt rounds). |
| **Testing Suite** | **Node.js Test Runner (`node:test`)** | Native test runner providing zero-dependency unit, integration, and benchmark test execution. |
| **Deployment** | **Render & Vercel** | Backend hosted on Render; frontend hosted on Vercel with automatic continuous deployment. |

---

## 📁 Project Structure

```text
codex-48/
├── .env.example                          # Sanitized environment template
├── package.json                          # Monorepo workspaces manifest (root)
├── README.md                             # Comprehensive platform documentation
├── workflows.md                          # Implementation blueprint and product specifications
├── vercel.json                           # Vercel SPA routing and reverse proxy rules
├── apps/
│   ├── api/                              # Express 4 Backend & Compliance Engine
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── app.js                    # Express app configuration & middleware routing
│   │   │   ├── server.js                 # HTTP server entrypoint bound to 0.0.0.0
│   │   │   ├── config/
│   │   │   │   ├── database.js           # MongoDB connection manager with auto in-memory fallback
│   │   │   │   ├── env.js                # Environment variable validation & safe defaults
│   │   │   │   ├── inMemoryStore.js      # Zero-dependency in-memory database fallback
│   │   │   │   ├── logger.js             # Structured JSON logger with credential masking
│   │   │   │   └── modelProxy.js         # Mongoose vs in-memory storage proxy abstraction
│   │   │   ├── jobs/
│   │   │   │   └── reviewWorker.js       # Background job processor for asynchronous reviews
│   │   │   ├── middleware/
│   │   │   │   ├── authenticate.js       # Bearer JWT token verification
│   │   │   │   ├── errorHandler.js       # Standardized error responses & HTTP mapping
│   │   │   │   ├── rateLimit.js          # Route-level and global rate limiters
│   │   │   │   ├── requestId.js          # Unique X-Request-ID propagation
│   │   │   │   ├── requireWorkspaceMember.js # Multi-tenant isolation & RBAC guard
│   │   │   │   └── uploadGuard.js        # Multer upload guard with magic-byte validation
│   │   │   ├── modules/
│   │   │   │   ├── audit/                # Append-only audit events & queries
│   │   │   │   ├── auth/                 # User registration, login, profile & JWT issuance
│   │   │   │   ├── health/               # System health checks & diagnostic ping
│   │   │   │   ├── imports/              # PDF/DOCX brief parsing & rule conversion (NI 1)
│   │   │   │   ├── insights/             # SLA metrics, approval rates & violation hotspots
│   │   │   │   ├── jobs/                 # Background processing job models
│   │   │   │   ├── revisions/            # Side-by-side text & visual revision diffing (NI 3)
│   │   │   │   ├── rules/                # Versioned Brand Rules & conflict detector (NI 2)
│   │   │   │   ├── submissions/          # Submissions, revisions, overrides & decisions
│   │   │   │   ├── visual/               # WCAG contrast math & OCR processing
│   │   │   │   └── workspaces/           # Tenant management & membership assignments
│   │   │   ├── providers/
│   │   │   │   └── geminiProvider.js     # Gemini Flash integration with structured output
│   │   │   ├── services/
│   │   │   │   ├── deterministicEngine.js # PR-104, superlatives, and disclaimers engine
│   │   │   │   ├── evidenceValidator.js   # Server-side citation integrity validator
│   │   │   │   ├── reviewOrchestrator.js  # Orchestration coordinator for all reviews
│   │   │   │   └── ruleSnapshotBuilder.js # Immutable rule snapshot freeze utility
│   │   │   └── storage/
│   │   │       └── fileStorage.js        # Private hashed file upload storage manager
│   │   └── tests/
│   │       ├── benchmark/                # 25-case golden benchmark test runner
│   │       ├── fixtures/                 # Sample documents and test assets
│   │       └── integration/              # 39 end-to-end automated integration tests
│   │
│   ├── test-fixtures/                    # Real test PDFs and brief fixtures
│   │   └── briefs/                       # Text-heavy, multi-heading, and corrupted PDFs
│   │
│   └── web/                              # React 18 + Vite Frontend
│       ├── package.json
│       ├── vite.config.js                # Vite build configuration with reverse proxy
│       └── src/
│           ├── main.jsx                  # React application entrypoint
│           ├── App.jsx                   # Root application shell & persistent tab manager
│           ├── index.css                 # Design tokens, typography & CSS variables
│           ├── api/
│           │   └── client.js             # REST client with Stale-While-Revalidate (SWR) cache
│           ├── components/
│           │   ├── JudgeDemoModal.jsx    # 1-Click interactive evaluator test harness
│           │   ├── Navbar.jsx            # Navigation bar, workspace switcher & role selector
│           │   └── OnboardingTour.jsx    # 10-step interactive guided onboarding tour
│           ├── pages/
│           │   ├── AuthPage.jsx          # Login, registration & demo account launcher
│           │   ├── BriefImportPage.jsx   # Multi-format brief parser UI
│           │   ├── InsightsPage.jsx      # Governance analytics dashboard
│           │   ├── ReviewDetailPage.jsx  # Findings breakdown & override manager
│           │   ├── RevisionDiffView.jsx  # Side-by-side text & contrast comparison
│           │   ├── RulesPage.jsx         # Brand Knowledge Registry management
│           │   └── SubmissionsPage.jsx   # Intake submissions list & intake creator
│           └── utils/
│               └── channelUtils.js       # Channel badges and styling helpers
│
├── docs/
│   ├── api.md                            # Complete REST API blueprint & schema reference
│   └── assets/
│       ├── cohesora-banner.svg           # High-resolution vector brand banner
│       └── screenshots/                  # Real application capture assets (01 to 07)
│
└── scripts/
    └── start-dev.js                      # Concurrent development orchestrator
```

---

## ⚡ Prerequisites & Quickstart

### Prerequisites
- **Node.js**: `v18.0.0` or higher (`v20+` or `v22 LTS` recommended)
- **npm**: `v9.0.0` or higher
- **MongoDB** *(Optional)*: Local MongoDB or cloud MongoDB Atlas instance.  
  > **Zero-Dependency Note**: Cohesora includes an automatic zero-dependency in-memory document store. If MongoDB is unavailable or unreachable, the application and test suites seamlessly operate in-memory without errors.

### Step 1: Clone Repository & Install Dependencies

```bash
git clone https://github.com/rajat552/codex-48.git
cd codex-48

# Install dependencies across all monorepo workspaces
npm install
```

### Step 2: Environment Configuration

Copy the example environment template:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

Ensure `.env` contains valid configuration values (or retain the pre-configured local development defaults).

### Step 3: Launch in Development Mode

Launch the Express API server and Vite frontend concurrently using the workspace orchestrator:

```bash
npm run dev
```

Once initialized, access the local services:
- **Web Application**: [`http://localhost:5173`](http://localhost:5173)
- **Backend API Base**: [`http://localhost:4000/api/v1`](http://localhost:4000/api/v1)
- **Health Diagnostic**: [`http://localhost:4000/api/v1/health`](http://localhost:4000/api/v1/health)

### Step 4: Build for Production

Compile the web application for production distribution:

```bash
npm run build
```

---

## 🔐 Environment Variables & Configuration

The platform requires configuration variables defined in `.env`. Sensible defaults are included for local development:

| Variable | Type | Required | Default | Purpose |
| :--- | :---: | :---: | :---: | :--- |
| `NODE_ENV` | String | Yes | `development` | Runtime environment (`development`, `production`, `test`). |
| `PORT` | Number | Yes | `4000` | Port for the Express API server. |
| `API_BASE_PATH` | String | Yes | `/api/v1` | URL path prefix for all REST endpoints. |
| `MONGODB_URI` | String | No | Local In-Memory | MongoDB connection string. Falls back to in-memory store if unset or unreachable. |
| `JWT_ACCESS_SECRET` | String | Yes | *Auto-fallback* | Cryptographic secret for signing short-lived access tokens. |
| `JWT_REFRESH_SECRET` | String | Yes | *Auto-fallback* | Cryptographic secret for signing long-lived refresh tokens. |
| `JWT_ISSUER` | String | Yes | `cohesora-api` | JWT issuer verification claim. |
| `JWT_AUDIENCE` | String | Yes | `cohesora-web` | JWT audience verification claim. |
| `ACCESS_TOKEN_TTL_MINUTES` | Number | Yes | `1440` | Expiry duration for access tokens. |
| `REFRESH_TOKEN_TTL_DAYS` | Number | Yes | `7` | Expiry duration for refresh tokens. |
| `GEMINI_API_KEY` | String | No | Empty | Google Gemini API key for external semantic evaluation. Operates deterministically when unset. |
| `GEMINI_MODEL` | String | No | `gemini-3.8-flash` | Gemini model variant used for semantic reviews. |
| `GEMINI_TIMEOUT_MS` | Number | No | `20000` | Timeout threshold before safely transitioning to `INCOMPLETE` state. |
| `UPLOAD_DIR` | String | Yes | `./private-uploads` | Directory for storing uploaded creative files. |
| `MAX_UPLOAD_BYTES` | Number | Yes | `10485760` (10 MB) | Maximum permitted file upload size. |
| `ALLOWED_ORIGINS` | String | Yes | `http://localhost:5173` | Comma-separated list of allowed CORS origins. |

---

## 📡 API Reference Summary

The table below outlines the primary REST endpoints implemented by the Cohesora backend. Detailed payloads, request headers, and schemas are documented in [`docs/api.md`](docs/api.md).

| Group | Method | Endpoint | Auth | Purpose |
| :--- | :---: | :--- | :---: | :--- |
| **System** | `GET` | `/` | None | Root deployment health probe & platform metadata. |
| **System** | `GET` | `/api/v1/health` | None | Service diagnostic endpoint (DB status, uptime, version). |
| **Auth** | `POST` | `/api/v1/auth/register` | None | Register tenant user, provision workspace, and issue JWT tokens. |
| **Auth** | `POST` | `/api/v1/auth/login` | None | Authenticate credentials and return active workspaces. |
| **Auth** | `GET` | `/api/v1/auth/me` | Bearer | Retrieve authenticated user profile and memberships. |
| **Workspaces** | `GET` | `/api/v1/workspaces` | Bearer | List workspaces accessible to the user (with auto-provisioning). |
| **Workspaces** | `POST` | `/api/v1/workspaces` | Bearer | Create a new brand governance workspace. |
| **Brand Rules** | `GET` | `/api/v1/workspaces/:wsId/rules` | Bearer | List workspace rules with category, status, and channel filters. |
| **Brand Rules** | `POST` | `/api/v1/workspaces/:wsId/rules` | `ADMIN` | Create a new brand rule in `DRAFT` status. |
| **Brand Rules** | `POST` | `/api/v1/workspaces/:wsId/rules/conflict-check` | `ADMIN` | **(NI 2)** Detect rule conflicts against active workspace rules. |
| **Brand Rules** | `POST` | `/api/v1/workspaces/:wsId/rules/:ruleId/approve` | `ADMIN` | Approve a draft rule for activation. |
| **Brand Rules** | `POST` | `/api/v1/workspaces/:wsId/rules/:ruleId/activate` | `ADMIN` | Activate an approved rule for review snapshots. |
| **Submissions** | `GET` | `/api/v1/workspaces/:wsId/submissions` | Bearer | List submissions with status and campaign search filters. |
| **Submissions** | `POST` | `/api/v1/workspaces/:wsId/submissions` | `CREATOR` | Ingest copy or static image creative and freeze rule snapshot. |
| **Submissions** | `GET` | `/api/v1/workspaces/:wsId/submissions/:id` | Bearer | Retrieve submission details, revisions, and finding breakdown. |
| **Submissions** | `POST` | `/api/v1/workspaces/:wsId/submissions/:id/review-runs` | Bearer | Trigger automated deterministic and semantic review pipeline. |
| **Submissions** | `POST` | `/api/v1/workspaces/:wsId/submissions/:id/revisions` | `CREATOR` | Submit Revision $N+1$ with updated copy or visual asset. |
| **Submissions** | `POST` | `/api/v1/workspaces/:wsId/submissions/:id/decisions` | `REVIEWER` | Human governance approval or changes request. |
| **Submissions** | `POST` | `/api/v1/workspaces/:wsId/submissions/:id/findings/:fId/override` | `REVIEWER` | Override finding with mandatory $\ge 5$ character audit reason. |
| **Diff** | `GET` | `/api/v1/workspaces/:wsId/submissions/:id/revisions/diff` | Bearer | **(NI 3)** Generate word-level text diff and contrast comparison. |
| **Briefs** | `POST` | `/api/v1/workspaces/:wsId/brief-imports` | `ADMIN` | **(NI 1)** Ingest and parse PDF/DOCX brief documents. |
| **Briefs** | `POST` | `/api/v1/workspaces/:wsId/brief-imports/:id/convert-to-rules` | `ADMIN` | Convert extracted brief candidates into draft brand rules. |
| **Insights** | `GET` | `/api/v1/workspaces/:wsId/insights` | Bearer | Aggregate SLA turnaround, approval rate, and top violated rules. |
| **Audit** | `GET` | `/api/v1/workspaces/:wsId/audit-events` | `ADMIN` | Query immutable append-only audit trail. |

---

## 🛡️ Security & Responsible AI Engineering

1. **Multi-Tenant Workspace Isolation**: Every database query is scoped by `workspaceId`. Cross-workspace requests are rejected with `403 Forbidden` or `404 Not Found`.
2. **Strict Role-Based Access Control (RBAC)**:
   - `CREATOR`: Permitted to submit copy, upload creatives, and generate new revisions.
   - `REVIEWER`: Authorized to approve campaigns, request changes, and override automated findings.
   - `ADMIN`: Authorized to configure brand rules, activate rules, run conflict detection, and inspect audit logs.
3. **Magic-Byte Content-Type Verification**: File uploads are inspected at the binary level using magic bytes to prevent file extension spoofing:
   - PNG: `89 50 4E 47`
   - JPEG: `FF D8 FF`
   - PDF: `25 50 44 46`
   - DOCX: `50 4B 03 04`
4. **Anti-Hallucination & Citation Integrity**: Gemini Flash outputs are intercepted on the server. If a returned finding references a rule ID not present in the active snapshot, the finding is reclassified as `NEEDS_VERIFICATION`.
5. **Zero AI Auto-Approval**: AI and OCR engines cannot transition content to `APPROVED`. A human reviewer must explicitly authorize clearance.
6. **Graceful Fail-Safe State**: When external AI providers or OCR services encounter rate limits or timeouts, the review is marked `INCOMPLETE` rather than silently marked compliant.
7. **Mandatory Audit Overrides**: Reviewers cannot dismiss findings without a substantive explanation ($\ge 5$ characters). The override reason, timestamp, and reviewer ID are permanently committed to the immutable audit log.

---

## 🧪 Verification & Benchmark Results

### Automated Test Suites (39 / 39 Passed)

Cohesora includes 39 automated integration and unit tests validating all core workflows and named improvements using the native Node.js Test Runner (`node:test`).

Run all tests:
```bash
npm test
```

```text
✔ Cohesora End-to-End API Integration Suite (14/14 tests passed)
  - User registration & JWT auth
  - Tenant isolation and RBAC verification
  - Brand rule creation & approval lifecycle
  - Promotional rule PR-104 enforcement
  - Creative submission intake & snapshot freeze
  - Automated review execution
  - Substantive human override validation
  - Revision creation & lineage
  - Side-by-side diff generation
  - Reviewer approval gating (0 blocking issues)
  - Append-only audit log verification
  - Governance insights aggregation
  - Cross-workspace isolation (T-09, 403 Forbidden)

✔ Multi-Format Document Parsing (5/5 tests passed)
  - PDF text-heavy extraction
  - PDF multi-heading policy detection
  - Promotional terms & tables extraction
  - Corrupted PDF safe failure handling
  - Unsupported file rejection

✔ WCAG 2.2 Contrast & CIEDE2000 Color Math (6/6 tests passed)
  - T-03: #FFF3B0 on white = 1.12:1 (Fails AA)
  - T-04: Approved Navy #1B2A4A on white = 14.22:1 (Passes AA/AAA)
  - Identical colors = 1.0:1
  - Black on white = 21.0:1
  - CIEDE2000 identical colors = 0.0 ΔE
  - Perceptible difference detection

✔ Automated Rule Conflict Detector (5/5 tests passed)
  - Prohibited term conflict detection
  - Incompatible free shipping threshold (499 vs 999)
  - Prohibiting required term conflict
  - Duplicate rule text detection
  - Non-overlapping negative control (0 false positives)

✔ Deterministic Review Engine (5/5 tests passed)
  - PR-104 free shipping condition violation
  - Properly qualified INR 999 claim pass
  - Prohibited superlative "cheapest" detection
  - Missing "*T&C apply" disclaimer
  - Low-contrast pale yellow advisory

✔ Side-by-Side Visual & Text Revision Diffing (4/4 tests passed)
  - Text insertion and deletion highlighting
  - Contrast delta calculation (+13.10:1)
  - Resolved vs persisting vs new finding categorization
  - Cross-workspace rejection guard

Total: 39 tests, 6 test suites, 39 passed, 0 failed, 0 skipped.
```

### 25-Case Golden Evaluation Benchmark

Cohesora is evaluated against a curated 25-case golden benchmark covering positive controls, negative controls, edge cases, and provider failure states.

Run the golden benchmark:
```bash
npm run test:benchmark
```

```text
================================================================
       COHESORA 25-CASE CURATED BENCHMARK EVALUATION           
================================================================

RESULTS BY CASE:
[BM-01] PASS (TP) : Unconditional free shipping claim violating PR-104 minimum order threshold (INR 999)
[BM-02] PASS (TP) : Zero delivery fee claim without minimum order value
[BM-03] PASS (TP) : Prohibited superlative "cheapest" in copy
[BM-04] PASS (TP) : Prohibited claim "100% risk-free" in promotional headline
[BM-05] PASS (TP) : Missing mandatory legal disclaimer "*T&C apply"
[BM-06] PASS (TP) : T-03: Low-contrast pale yellow (#FFF3B0) on white text region (< 4.5:1 AA)
[BM-07] PASS (TP) : Sub-threshold contrast ratio (2.8:1) failing normal-text AA standard
[BM-08] PASS (TP) : Free delivery claim under INR 500 violating minimum INR 999 condition
[BM-09] PASS (TP) : Prohibited word variation with punctuation "cheapest!" in sentence
[BM-10] PASS (TP) : Promotional copy omitting disclaimer on seasonal discount
[BM-11] PASS (TP) : Free shipping on all orders claim in email newsletter copy
[BM-12] PASS (TP) : Severely degraded contrast ratio (1.05:1) on white background
[BM-13] PASS (TN) : Properly qualified free shipping on orders above INR 999 with mandatory disclaimer
[BM-14] PASS (TN) : Brand-compliant copy using approved term "affordable" and disclaimer
[BM-15] PASS (TN) : T-04: High-contrast Navy (#1B2A4A) on white satisfying AA 14.22:1
[BM-16] PASS (TN) : Informational product feature overview without promotional promises
[BM-17] PASS (TN) : Customer testimonial copy adhering to terminology and disclaimer guidelines
[BM-18] PASS      : T-02: Unsupported factual promise "Increases sales by 400%" with no active source
[BM-19] PASS      : Unsubstantiated market leadership claim "Ranked #1 brand tool globally"
[BM-20] PASS      : Zero carbon neutral claim lacking registered sustainability evidence
[BM-21] PASS      : Informal colloquial tone concern on enterprise channel
[BM-22] PASS      : Urgency pressuring copy advisory
[BM-23] PASS      : T-06: External AI provider timeout safely marks review INCOMPLETE without crashing
[BM-24] PASS      : T-07: Unusable or failed OCR extraction marks review INCOMPLETE with safe diagnostics
[BM-25] PASS      : T-15: Malformed/disguised file payload is safely rejected at intake guard
```

| Evaluation Metric | Measured Result | Blueprint Target | Status |
| :--- | :---: | :---: | :---: |
| **Deterministic Recall** | **100.0%** (12/12) | $\ge 95\%$ | ✅ **EXCEEDED** |
| **Deterministic Precision** | **100.0%** (12/12) | - | ✅ **PERFECT** |
| **F1 Score** | **100.0%** | - | ✅ **OPTIMAL** |
| **Citation Integrity** | **100.0%** | $100\%$ | ✅ **SATISFIED** |
| **Zero AI Auto-Approval** | **100.0%** | $100\%$ | ✅ **ENFORCED** |
| **Total Test Cases** | **25 / 25** | 25 | ✅ **COMPLETED** |

---

## 🌐 Production Deployment

Cohesora is deployed in high-availability production across dual cloud environments:

- **Frontend (Vercel)**: Static React 18 + Vite build with client-side SPA routing and transparent reverse proxy rules.
  - Production Application URL: [`https://codex-48.vercel.app`](https://codex-48.vercel.app)
  - Vercel Proxy Configuration: [`vercel.json`](vercel.json) transparently routes all `/api/v1/*` requests to the Render backend while serving `/index.html` for client routing.
- **Backend (Render)**: Containerized Express 4 API server running with automated background review workers and persistent MongoDB Atlas storage.
  - Production API URL: [`https://codex-48.onrender.com`](https://codex-48.onrender.com)
  - Readiness Health Probe: [`https://codex-48.vercel.app/api/v1/health/ready`](https://codex-48.vercel.app/api/v1/health/ready) &bull; [`https://codex-48.onrender.com/api/v1/health/ready`](https://codex-48.onrender.com/api/v1/health/ready)
  - Liveness Health Probe: [`https://codex-48.vercel.app/api/v1/health/live`](https://codex-48.vercel.app/api/v1/health/live) &bull; [`https://codex-48.onrender.com/api/v1/health/live`](https://codex-48.onrender.com/api/v1/health/live)
  - Root Service Probe: `GET /` returning `{"name":"Cohesora Platform API","status":"online","version":"1.0.0"}`

### Live Cloud Production Verification (12 / 12 Steps Passed)

Executed directly against the live production deployment (`https://codex-48.vercel.app/api/v1`):

```text
--- LIVE PRODUCTION VERIFICATION (https://codex-48.vercel.app) ---
✓ 1. User & Workspace registered
✓ 2. Brand Rule PR-104 created
✓ 3. Rule PR-104 approved and activated
✓ 4. Creative Submission intake accepted
✓ 5. Automated Review executed (1 rule violation flagged)
✓ 6. Reviewer decision recorded (status: rejected)
✓ 7. Submissions list retrieved (1 creative, status: rejected)
✓ 8. Insights metrics computed (PENDING: 0, IN_REVIEW: 0, REJECTED: 1)
✓ 9. Revision 2 created with compliant copy
✓ 10. Side-by-Side Diff computed (Resolved conflicts verified)
✓ 11. Revision 2 approved (Final status: approved)
✓ 12. Audit Trail verified (9 lifecycle events recorded)
--- ALL 12 END-TO-END STEPS PASSED WITH 100% SUCCESS ---
```

---

## 🗺️ Roadmap & Planned Enhancements

| Capability | Category | Status |
| :--- | :--- | :---: |
| **Multi-Format Brief Document Parsing (PDF / DOCX)** | Named Improvement 1 | ✅ **Completed** |
| **Automated Rule Conflict Detection on Import** | Named Improvement 2 | ✅ **Completed** |
| **Side-by-Side Visual & Text Revision Diffing** | Named Improvement 3 | ✅ **Completed** |
| **Deterministic Rule PR-104 Enforcement** | Core Compliance | ✅ **Completed** |
| **WCAG 2.2 Contrast & CIEDE2000 Color Math** | Core Compliance | ✅ **Completed** |
| **Zero AI Auto-Approval Human Gating** | Responsible AI | ✅ **Completed** |
| **Interactive 10-Step Onboarding Tour** | User Experience | ✅ **Completed** |
| **1-Click Judge Showcase Demo Harness** | Evaluator Experience | ✅ **Completed** |
| **Append-Only Audit Trail & SLA Analytics** | Governance | ✅ **Completed** |
| **Sub-Millisecond SWR Client Caching** | Performance | ✅ **Completed** |
| **Concurrency Shield & Pre-Write Re-Verification** | Architecture | ✅ **Completed** |
| **Transparent Session Recovery & Cold-Start Resilience** | Architecture | ✅ **Completed** |
| *Enterprise SSO (SAML 2.0 / Okta / Azure AD)* | Enterprise Identity | 📋 *Planned* |
| *Video Keyframe Extraction & Motion Graphics Review* | Asset Expansion | 📋 *Planned* |
| *Webhook Notifications (Slack / MS Teams)* | Integrations | 📋 *Planned* |
| *Automated Figma Design Token Sync* | Integrations | 📋 *Planned* |

---

## ⚠️ Known Limitations

1. **Complex Brief Layouts**: The document parser extracts text, tables, and headings from standard PDFs and Word DOCX briefs. Highly ornate multi-column agency brochures with complex embedded vector layers may require manual candidate review.
2. **OCR Image Quality**: Tesseract.js performs reliably on clear raster typography. Highly stylized cursive or low-resolution compressed graphics ($< 72$ DPI) may yield partial text extraction and trigger the `INCOMPLETE` safe diagnostic state.
3. **Single Active LLM Adapter**: The platform currently integrates Google Gemini Flash. While the provider interface is modular, dynamic multi-model consensus routing (e.g., fallback to Claude or GPT-4o) is planned for a future release.
4. **Free-Tier Cold Starts**: When hosted on Render's free tier, the backend may take 30–50 seconds to spin up from an idle state. Once active, all requests respond with normal sub-second latencies.

---

## 👥 Authorship & License

- **Team**: **BroCode**
- **Sole Designer & Developer**: **Rajat Aggarwal** (*National Institute of Technology, Hamirpur*)
- **Email**: `rajataggarwal9646@gmail.com`
- **Platform**: **Cohesora — Evidence-Led Brand Governance Platform**
- **Event Context**: **We Code Coders Hackathon | Inkloom AI — Brand Governance Platform**
- **Submission Stage**: **Round 1 — The Plan (Implementation & Live Deployment)**
- **License**: **UNLICENSED** &bull; Proprietary to Cohesora. All rights reserved.
