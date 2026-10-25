# Cohesora API Reference Blueprint

Version: `1.0.0`  
Base URL: `/api/v1`  
Protocol: `HTTPS` (or `HTTP` locally)  
Auth Scheme: `Bearer <JWT_TOKEN>`

---

## 1. Authentication & Tenant Identity

### `POST /auth/register`
Creates a new tenant user and personal workspace.
- **Request Body**:
  ```json
  {
    "email": "lead@company.com",
    "password": "Min8CharactersPassword!",
    "displayName": "Alex Turner",
    "workspaceName": "Acme Brand Global"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "data": {
      "user": { "_id": "...", "email": "lead@company.com", "displayName": "Alex Turner" },
      "workspace": { "_id": "...", "name": "Acme Brand Global", "slug": "acme-brand-global" },
      "token": "eyJhbGciOi..."
    }
  }
  ```

### `POST /auth/login`
- **Request Body**:
  ```json
  {
    "email": "lead@company.com",
    "password": "Min8CharactersPassword!"
  }
  ```
- **Response** (`200 OK`): Returns user profile and signed JWT token.

### `GET /auth/me`
Returns authenticated user identity and active tenant context.

---

## 2. Brand Knowledge Registry & Conflict Detection

### `GET /workspaces/:workspaceId/rules`
Lists rules for the workspace. Filterable by `category`, `status`, `campaignScope`, `channelScope`.

### `POST /workspaces/:workspaceId/rules`
Creates a new brand rule in `DRAFT` status. Requires `ADMIN` role.
- **Payload**:
  ```json
  {
    "ruleId": "PR-104",
    "title": "Free Shipping Minimum Spend Requirement",
    "category": "promotional_condition",
    "severity": "high",
    "ruleText": "Free shipping promotions must stipulate a minimum order value of INR 999.",
    "ruleConfig": {
      "benefit": "free_shipping",
      "minimumExclusive": 999
    },
    "sourceId": "legal-promo-guideline",
    "sourceVersion": "v2.1",
    "campaignScope": ["*"],
    "channelScope": ["SOCIAL", "EMAIL", "PRINT", "LANDING_PAGE", "SMS"]
  }
  ```

### `POST /workspaces/:workspaceId/rules/conflict-check` *(Named Improvement 2)*
Detects candidate rule conflicts against all active workspace rules before activation.
- **Request Body**: Candidate rule payload.
- **Response** (`200 OK`):
  ```json
  {
    "hasConflict": true,
    "conflicts": [
      {
        "type": "PROHIBITED_TERM_CONFLICT",
        "severity": "CRITICAL",
        "description": "Rule requires term prohibited by active rule PR-012",
        "conflictingRule": { "ruleId": "PR-012" }
      }
    ]
  }
  ```

### `POST /workspaces/:workspaceId/rules/:ruleId/approve`
Transitions rule from `DRAFT` to `APPROVED`. Requires `ADMIN`.

### `POST /workspaces/:workspaceId/rules/:ruleId/activate`
Activates an approved rule for production snapshots. Re-evaluates conflict detection.

---

## 3. Creative Intake & Automated Review

### `POST /workspaces/:workspaceId/submissions`
Multi-part form submission intake.
- **Fields**:
  - `title`: Creative title (string, required)
  - `campaignId`: Campaign identifier (string, required)
  - `channel`: `EMAIL` | `SOCIAL` | `PRINT` | `LANDING_PAGE` | `SMS`
  - `copyText`: Ad copy (string, required)
  - `asset`: Optional image (`image/png`, `image/jpeg`, max 10MB)
  - `assetAltText`: Optional accessibility description
- **Behavior**:
  1. Freezes active workspace rules into immutable `ruleSnapshot`.
  2. Runs deterministic checks:
     - Terminology violations
     - Promotional thresholds (PR-104)
     - Missing legal disclaimers
     - WCAG 2.2 contrast ratio & color ΔE2000
  3. Invokes Gemini Flash adapter with server-side evidence citation validation.
  4. Appends audit event `SUBMISSION_CREATED`.

### `GET /workspaces/:workspaceId/submissions/:id`
Retrieves submission, current revision findings, rule snapshots, and decision history.

### `POST /workspaces/:workspaceId/submissions/:id/revisions`
Submits an iterative revision for an existing submission.
- **Payload**: `{ "copyText": "Updated copy...", "revisionNotes": "Fixed threshold" }`
- **Behavior**: Re-runs automated review against the frozen snapshot and stores Revision `N+1`.

### `GET /workspaces/:workspaceId/submissions/:id/revisions/diff` *(Named Improvement 3)*
Calculates side-by-side text diff, visual metric comparison, and finding resolution.
- **Query Params**: `?fromRevision=1&toRevision=2`
- **Response** (`200 OK`):
  ```json
  {
    "textDiff": { "chunks": [{ "value": "...", "added": true }] },
    "visualDelta": {
      "fromMetrics": { "contrastRatio": 1.12 },
      "toMetrics": { "contrastRatio": 14.22 },
      "contrastDifference": 13.10
    },
    "findingsDiff": {
      "resolvedFindings": [...],
      "persistingFindings": [...],
      "newFindings": [...]
    }
  }
  ```

---

## 4. Human Approval & Finding Overrides

### `POST /workspaces/:workspaceId/submissions/:id/findings/:findingId/override`
Overrides a specific brand finding. Requires `REVIEWER` or `ADMIN`.
- **Payload**:
  ```json
  { "reason": "Legal exemption granted per Summer Sale Ticket #892" }
  ```
- **Validation**: Reason is mandatory and must be substantive (>= 5 chars). Records `FINDING_OVERRIDDEN` in audit trail.

### `POST /workspaces/:workspaceId/submissions/:id/decisions`
Submits human reviewer governance decision. Requires `REVIEWER` or `ADMIN`.
- **Payload**:
  ```json
  {
    "status": "APPROVED",
    "comments": "All brand guidelines satisfied."
  }
  ```
- **Server Guard**: Prevents `APPROVED` decision if any active blocking `CONFIRMED_RULE_CONFLICT` remains un-overridden.

---

## 5. Multi-Format Brief Parsing *(Named Improvement 1)*

### `POST /workspaces/:workspaceId/brief-imports`
Uploads a PDF or DOCX brand brief document.
- **File**: `brief` (multipart, `.pdf` or `.docx`)
- **Response** (`200 OK`):
  ```json
  {
    "importId": "...",
    "extractedText": "...",
    "parsedHeadings": ["Typography", "Colors", "Promotions"],
    "candidateRules": [
      {
        "ruleId": "CAND-001",
        "title": "Extracted Heading Rule",
        "category": "visual_style"
      }
    ]
  }
  ```

### `POST /workspaces/:workspaceId/brief-imports/:importId/convert-to-rules`
Promotes candidate rules extracted from document into formal brand rules in draft status.

---

## 6. Audit Trail & Governance Insights

### `GET /workspaces/:workspaceId/audit-events`
Returns tamper-evident, append-only chronological log of all governance events.

### `GET /workspaces/:workspaceId/insights`
Aggregates compliance turnaround, first-time-right rates, top triggered rules, and override patterns.
