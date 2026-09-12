# Banking Credentials & Profile Section — Plan

## Top-Level Overview

Add a new **"Banking Profiles"** section to the Finance Tracker that stores a full per-bank credential profile in one place — customer ID, net banking username, net banking password, IFSC, MICR, branch details, registered mobile/email, debit card info (last 4 digits + expiry only, never the full number), UPI IDs, and a notes field. This is a personal reference vault so the user never has to hunt across apps or documents for banking details.

Security is handled in two layers:
1. **Masking at UI level** — sensitive fields (Customer ID, net banking username, net banking password, account number) are blurred by default and revealed only on click, exactly like the password-visibility toggle pattern.
2. **Column-level encryption at DB level** — the sensitive columns are encrypted using SQL Server's `ENCRYPTBYPASSPHRASE` / `DECRYPTBYPASSPHRASE` with a server-side passphrase stored in the `.env` file (never in the DB or frontend). No third-party libraries are needed.

The new section follows the **exact same full-stack pattern** every other section uses:
- SQL table + migration script in `db/`
- Express route file in `backend/routes/`
- Route mounted in `backend/server.js`
- HTML page block + sidebar nav link in `frontend/index.html`
- JS functions (load, add, edit, delete, modal) added to `frontend/js/app.js`

---

## Sub-Tasks

---

### Sub-Task 1 — Database: Migration Script

**Intent**
Create a new SQL migration file that adds the `dbo.BankingProfiles` table. Sensitive columns store encrypted blobs; non-sensitive columns are plain text. No changes to existing tables.

**Fields to store per profile:**

| Column | Type | Sensitive? | Notes |
|---|---|---|---|
| ProfileID | INT IDENTITY PK | — | auto |
| BankName | NVARCHAR(100) | No | e.g. "SBI", "HDFC" |
| Nickname | NVARCHAR(100) | No | e.g. "SBI Salary Account" |
| AccountNumber | NVARCHAR(200) | **Yes** | encrypted |
| AccountType | NVARCHAR(20) | No | Savings / Current / NRE / NRO |
| IFSCCode | NVARCHAR(20) | No | branch IFSC |
| MICRCode | NVARCHAR(20) | No | |
| BranchName | NVARCHAR(200) | No | |
| BranchCity | NVARCHAR(100) | No | |
| CustomerID | NVARCHAR(200) | **Yes** | encrypted |
| NetBankingLoginID | NVARCHAR(200) | **Yes** | encrypted — username |
| NetBankingPassword | NVARCHAR(200) | **Yes** | encrypted — login password |
| RegisteredMobile | NVARCHAR(50) | No | |
| RegisteredEmail | NVARCHAR(200) | No | |
| DebitCardLast4 | NVARCHAR(10) | No | only last 4 digits |
| DebitCardExpiry | NVARCHAR(10) | No | MM/YY |
| UPIIds | NVARCHAR(500) | No | comma-separated |
| Notes | NVARCHAR(1000) | No | free text |
| CreatedAt | DATETIME DEFAULT GETDATE() | — | |
| LastUpdated | DATETIME DEFAULT GETDATE() | — | |

Encrypted columns use `NVARCHAR(500)` (binary-to-hex storage) so they survive collation.

**Expected Outcomes**
- File `db/add_banking_profiles.sql` exists
- Running it against `FinanceTracker` creates `dbo.BankingProfiles`
- Encrypted columns are stored as hex-encoded ciphertext

**Todo List**
- [ ] Create `db/add_banking_profiles.sql` with `CREATE TABLE` DDL
- [ ] Use `ENCRYPTBYPASSPHRASE(@key, @val)` cast to `NVARCHAR(500)` for sensitive cols
- [ ] Add `IF OBJECT_ID ... IS NULL` guard so it is safe to run twice

**Relevant Context**
- Pattern: `db/schema.sql` lines 21–34 (BankAccounts table structure)
- Encryption passphrase will be read from `process.env.DB_ENCRYPT_KEY` in the route

**Status:** `[ ] pending`

---

### Sub-Task 2 — Backend: Express Route

**Intent**
Create `backend/routes/bankingprofiles.js` with full CRUD. The route encrypts sensitive fields on write using a raw SQL `ENCRYPTBYPASSPHRASE` call (passing the passphrase as a parameterised input) and decrypts on read. The frontend never sees the raw passphrase.

**Endpoints**
| Method | Path | Action |
|---|---|---|
| GET | `/api/bankingprofiles` | List all profiles (sensitive fields decrypted) |
| GET | `/api/bankingprofiles/:id` | Single profile |
| POST | `/api/bankingprofiles` | Create |
| PUT | `/api/bankingprofiles/:id` | Update |
| DELETE | `/api/bankingprofiles/:id` | Delete |

**Security note:** The passphrase is injected as a SQL parameter — it never appears as a string literal in the query, so it cannot be read from SQL Server's query store.

**Expected Outcomes**
- `backend/routes/bankingprofiles.js` exists with all 5 endpoints
- Sensitive fields are encrypted before INSERT/UPDATE
- Sensitive fields are decrypted in SELECT and returned as plain text to the (already-authenticated) frontend
- No passphrase or key material is logged or exposed in responses

**Todo List**
- [ ] Create `backend/routes/bankingprofiles.js`
- [ ] Read `process.env.DB_ENCRYPT_KEY` at the top of the file
- [ ] Encrypt `AccountNumber`, `CustomerID`, `NetBankingLoginID`, `NetBankingPassword` using `ENCRYPTBYPASSPHRASE`
- [ ] Decrypt those same columns in SELECT using `DECRYPTBYPASSPHRASE` cast to `NVARCHAR`
- [ ] Handle null gracefully (not all fields will always be filled)

**Relevant Context**
- Pattern: `backend/routes/accounts.js` (full CRUD with parameterised inputs)
- Pattern: `backend/routes/notes.js` (nullable fields handled with `|| null`)
- `DB_ENCRYPT_KEY` env var to be added to `backend/.env.example`

**Status:** `[ ] pending`

---

### Sub-Task 3 — Backend: Register Route in Server

**Intent**
Mount the new route in `backend/server.js` so it is reachable at `/api/bankingprofiles`.

**Expected Outcomes**
- One new `app.use(...)` line added to `server.js`

**Todo List**
- [ ] Add `app.use('/api/bankingprofiles', require('./routes/bankingprofiles'));` to `backend/server.js` after the existing routes

**Relevant Context**
- `backend/server.js` lines 17–29 (route mounting block)

**Status:** `[ ] pending`

---

### Sub-Task 4 — Frontend: Sidebar Nav Link + HTML Page Block

**Intent**
Add a **"Banking Profiles"** entry to the sidebar nav and a full `<div class="page" id="page-bankingprofiles">` block to `frontend/index.html`.

The page layout:
- Page header with "+ Add Profile" button
- Summary stat card showing count of profiles stored
- A card-per-bank visual row (like credit cards) showing bank name, nickname, account type, and IFSC — no sensitive data visible here
- A detail table below with all non-sensitive fields visible and sensitive fields shown as `••••••` with a 👁 reveal button

**Expected Outcomes**
- Sidebar shows "🔐 Banking Profiles" link
- Page renders correctly when navigated to
- Sensitive cells display masked by default

**Todo List**
- [ ] Add sidebar `<a>` entry in `frontend/index.html` nav block (after the Notes link)
- [ ] Add `<div class="page" id="page-bankingprofiles">` section with header, stat card, card row, and detail table
- [ ] Table columns: Bank, Nickname, Type, IFSC, MICR, Branch, Mobile, Email, Debit Last4, Expiry, UPI IDs, Customer ID (masked), Net Banking Username (masked), Net Banking Password (masked), Account No (masked), Actions
- [ ] Masked cells use `<span class="masked-field">` with a toggle button

**Relevant Context**
- `frontend/index.html` lines 50–52 (Notes sidebar link — add after this)
- `frontend/index.html` lines 704–756 (Notes page block — add after this)
- Credit cards page (lines 418–468) for the visual card-per-item row pattern

**Status:** `[ ] pending`

---

### Sub-Task 5 — Frontend: JavaScript (load, add, edit, delete, mask/reveal)

**Intent**
Add all JS functions to `frontend/js/app.js` to drive the Banking Profiles page: `loadBankingProfiles()`, `addBankingProfile()`, `editBankingProfile(id)`, `deleteBankingProfile(id)`, and the inline `toggleMask(btn)` helper.

**Modal form fields (Add / Edit):**
- Bank Name, Nickname, Account Type (dropdown), IFSC Code, MICR Code
- Branch Name, Branch City
- Customer ID, Net Banking Username, Net Banking Password, Account Number *(all four labelled "sensitive — stored encrypted")*
- Registered Mobile, Registered Email
- Debit Card Last 4, Debit Card Expiry, UPI IDs
- Notes

**Masking behaviour:**
- Sensitive columns in the table render as `••••••` inside a `<span>` with `data-real="<actual value>"`
- A small 👁 button next to each masked span toggles `display` between the masked placeholder and real value
- Data attribute holds the real value client-side (already decrypted server-side, but never rendered to DOM in plain text until the user explicitly clicks reveal)

**Expected Outcomes**
- Page loads and shows all profiles in table
- Add modal saves correctly, page refreshes
- Edit modal pre-fills all fields including sensitive ones
- Delete with confirmation works
- 👁 toggle reveals / re-masks individual fields

**Todo List**
- [ ] Add `loadBankingProfiles()` function — fetch `/api/bankingprofiles`, render stat card count, card row, and table rows
- [ ] Render sensitive table cells as `<span class="masked-val">••••••</span><button onclick="toggleMask(this)" data-real="ACTUAL">👁</button>`
- [ ] Add `toggleMask(btn)` helper that swaps the sibling span text between `••••••` and `btn.dataset.real`
- [ ] Add `addBankingProfile()` — opens modal with blank form, POST on save
- [ ] Add `editBankingProfile(id)` — fetches record, opens modal pre-filled, PUT on save
- [ ] Add `deleteBankingProfile(id)` — confirm + DELETE
- [ ] Wire `navigate('bankingprofiles')` to call `loadBankingProfiles()` in the existing page-switch logic

**Relevant Context**
- `frontend/js/app.js` — follow exact modal pattern used by `addAccount()`, `editAccount()`, `deleteAccount()`
- Page switch dispatch is done via `data-page` attribute on nav links and a central `navigate()` function in `app.js`

**Status:** `[ ] pending`

---

### Sub-Task 6 — Environment: Add Encryption Key Variable

**Intent**
Document the new `DB_ENCRYPT_KEY` environment variable so it is not missed during setup or deployment.

**Expected Outcomes**
- `backend/.env.example` has a `DB_ENCRYPT_KEY=` entry with a comment explaining its purpose
- `Infrastructure/README.md` or `Infrastructure/DEPLOYMENT_GUIDE.md` notes that this env var must be set before running the backend

**Todo List**
- [ ] Add `DB_ENCRYPT_KEY=your-strong-passphrase-here` to `backend/.env.example` with a comment
- [ ] Add a note to `Infrastructure/DEPLOYMENT_GUIDE.md` under environment variables section

**Relevant Context**
- `backend/.env.example` (existing env var documentation)
- `Infrastructure/DEPLOYMENT_GUIDE.md`

**Status:** `[ ] pending`

---

## Security Summary

| Threat | Mitigation |
|---|---|
| Someone reads the DB directly | Account Number, Customer ID, Net Banking Username, Net Banking Password are encrypted at rest with `ENCRYPTBYPASSPHRASE` |
| Passphrase leaks via SQL logs | Passphrase is always a parameterised SQL input, never a string literal |
| Passphrase leaks via source code | Stored only in `.env` / environment variable, not in code or DB |
| Accidental screen sharing exposes secrets | Sensitive fields masked by default in UI; user must click 👁 to reveal each one |
| API response exposes credentials | Data is already decrypted server-side before returning to the authenticated session — same trust boundary as every other page in this app |
