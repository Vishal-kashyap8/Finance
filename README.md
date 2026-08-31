# 💰 Personal Finance Tracker

A full-stack personal finance management application — Node.js/Express backend + plain HTML/CSS/JS frontend + SQL Server database.

---

## Features

| Module | What you can track |
|---|---|
| 📊 Dashboard | Hero net worth + liabilities panel, asset breakdown, **net worth trend chart (6 months)**, FD/RD maturity alerts (🔔), monthly income vs expense chart, expense donut, recent transactions, **Reminders & Todos action card** |
| 🏦 Bank Accounts | Savings & Current accounts across multiple banks — balance, interest rate, **masked account number** |
| 💵 Cash Holdings | Cash in hand, wallets, emergency cash by category |
| 🏛️ Fixed Deposits | Bank, principal, rate, start/maturity dates, maturity amount, status, maturity alerts |
| 📅 Recurring Deposits | Monthly installment, installments paid/remaining, expected maturity amount, maturity alerts |
| 📈 Investments | Mutual Funds, Stocks, PPF, NPS, Gold, Bonds, ETFs — invested vs current value, gain/loss |
| 💳 Credit Cards | Multiple cards — credit limit, outstanding, minimum due, utilisation, reward points, APR, **masked last-4 digits**, **edit directly from card tile** |
| 🤝 Loans | Money borrowed (you owe) and money lent (others owe you) — principal, outstanding, interest, due dates |
| 🧾 Income & Expenses | Categorised income and expense transactions with **Date, Type, Category, and Paid Via column filters** |
| 🏢 EPFO Balance | Employee Provident Fund accounts — **masked UAN**, employer, balance |
| 🧾 Income Tax | Year-wise tax records — gross income, taxable income, TDS, advance tax, self-assessment tax, interest & fee payable, refunds, filing status |
| 📝 Payments & Notes | Payment reminders, todos, notes and reminders — title, type, priority, due date, amount, tags, free-text body |

---

## Privacy & Masking

All financial values and sensitive identity fields are **hidden by default**. Each section has its own independent 👁 **Show / Hide** button in the section header — revealing values in one section does **not** affect any other section.

| Field | Masked as |
|---|---|
| All monetary amounts | `₹••••••` |
| Bank account numbers | `••••••` |
| Credit card last-4 digits | `**** ••••••` |
| EPFO UAN | `••••••` |

> **Per-section isolation:** The visibility state of every page is tracked independently. You can reveal your Bank Account balances while Investments and Credit Cards stay masked.

---

## Dashboard Highlights

### Net Worth Trend Chart
A full-width SVG area + line chart showing your estimated net worth for each of the last 6 months. Uses your current total asset value and walks it back month-by-month using your recorded net savings (income − expenses).

- 🟢 Green line = net worth growing
- 🔴 Red line = net worth declining
- Shows start value, current value, and absolute + % change
- Respects the per-section privacy toggle

### Expense Impact
The Net Worth hero card sub-text shows your all-time net flow — `▲ saved` or `▼ spent` — so you can see at a glance whether your cumulative spending has exceeded your income. The Net Worth Breakdown card also shows all-time income and expense totals as context rows.

### Reminders & Todos Action Card
Any item in Payments & Notes with type **Reminder** or **Todo** that is not yet marked Done automatically surfaces on the dashboard as an action card. Each mini-card shows the title, priority, due date (with overdue highlighting), amount, and a **✔ Mark Done** button. The card hides automatically when there are no pending items.

---

## Transaction Filters

The Income & Expenses page supports four independent column filters that can be combined freely:

| Filter | Values |
|---|---|
| **Date** | Month picker — shows transactions for a specific month |
| **Type** | All / Income / Expense |
| **Category** | Dynamically populated from your category list; filtered by selected Type |
| **Paid Via** | All / Cash / Bank Account / Credit Card / Salary / Other |

Changing the **Type** filter automatically narrows the **Category** dropdown to matching categories. The **Clear** button resets all four filters at once.

---

## Transaction Categories

### Income
| Category | Icon |
|---|---|
| Salary | 💼 |
| Bonus | 🎯 |
| Interest | 📈 |
| Freelance | 🧑‍💻 |
| Rental Income | 🏘 |
| Dividends | 📊 |
| Cashback & Rewards | 🎁 |
| Gifts Received | 🎀 |
| Refund | ↩ |
| Other Income | 💰 |

### Expense
| Category | Icon |
|---|---|
| Rent | 🏠 |
| Food | 🍽 |
| Groceries | 🛒 |
| Dining Out | 🍴 |
| Utilities | ⚡ |
| Electricity | 💡 |
| Mobile Recharge | 📱 |
| Internet | 🌐 |
| Gas / LPG | 🔥 |
| Water Bill | 💧 |
| Travel | ✈ |
| Fuel | ⛽ |
| Shopping | 🛍 |
| Entertainment | 🎬 |
| Subscriptions | 📺 |
| Healthcare | 🏥 |
| Education | 📚 |
| Insurance | 🛡 |
| Home Maintenance | 🔧 |
| Personal Care | 🧴 |
| Gifts & Donations | 🤝 |
| Taxes & Fees | 🏛 |
| EMI | 🏦 |
| Credit Card Bill | 💳 |
| Other | 📌 |

> Categories are stored in `dbo.TransactionCategories`. Emoji icons are rendered client-side to avoid SQL Server collation issues.

---

## Prerequisites

- **Node.js** v18+ — [nodejs.org](https://nodejs.org)
- **SQL Server** (any edition — Express is free) — installed locally
- **SQL Server Management Studio (SSMS)** — to run schema scripts

---

## Setup (One-time)

### 1. Create the database

Open SSMS → Connect to `localhost` → Open `db\schema.sql` → Execute (F5).

Or via command line:
```
sqlcmd -S localhost -E -i db\schema.sql
```

This creates the `FinanceTracker` database with all core tables and seed data.

### 2. Run migration scripts (in order)

```
sqlcmd -S localhost -E -i db\add_payment_source.sql
sqlcmd -S localhost -E -i db\add_loans.sql
sqlcmd -S localhost -E -i db\add_creditcards.sql
sqlcmd -S localhost -E -i db\add_epfo.sql
sqlcmd -S localhost -E -i db\add_incometax.sql
sqlcmd -S localhost -E -i db\add_incometax_interest.sql
sqlcmd -S localhost -E -i db\add_notes.sql
sqlcmd -S localhost -E -i db\add_credit_card_bill_category.sql
sqlcmd -S localhost -E -i db\add_categories.sql
```

Each script is idempotent — safe to re-run:
- Table/column creation scripts use `IF OBJECT_ID ... IS NULL` or `IF NOT EXISTS` guards.
- Running a script a second time will print a "already exists — skipped" message and make no changes.

### 3. Configure connection

```
cd backend
copy .env.example .env
```

Edit `backend\.env`:
- **Windows Authentication** (default, recommended): leave `DB_TRUSTED_CONNECTION=true`
- **SQL Auth**: set `DB_USER`, `DB_PASSWORD`, and `DB_TRUSTED_CONNECTION=false`

### 4. Install dependencies & start

```
setup.bat          # installs npm packages (run once)
start.bat          # starts the server + opens browser automatically
```

Then open **http://localhost:3001** in your browser.

> **Tip:** A desktop shortcut named *Personal Finance Tracker* can be created by running `start.bat` from the desktop shortcut — double-click it and the app starts and opens in your browser automatically.

---

## Project Structure

```
Finance/
├── db/
│   ├── schema.sql                        # Core schema: tables, views, seed data
│   ├── add_payment_source.sql            # Adds PaymentSource column to Transactions
│   ├── add_loans.sql                     # Adds Loans table
│   ├── add_creditcards.sql               # Adds CreditCards table
│   ├── add_epfo.sql                      # Adds EPFOAccounts table
│   ├── add_incometax.sql                 # Adds IncomeTax table
│   ├── add_incometax_interest.sql        # Adds InterestAndFee column to IncomeTax
│   ├── add_notes.sql                     # Adds Notes table (Payments & Notes module)
│   ├── add_credit_card_bill_category.sql # Adds Credit Card Bill expense category
│   ├── add_categories.sql               # Adds extended Income & Expense categories
│   ├── fix_icons.sql                     # Category icon/emoji fix patch
│   ├── create_login.sql                  # SQL Server login creation helper
│   └── enable_mixed_auth.sql             # Enable SQL Server mixed-mode auth
├── backend/
│   ├── server.js               # Express app entry point
│   ├── db.js                   # SQL Server connection pool (mssql)
│   ├── .env.example            # Environment config template
│   └── routes/
│       ├── auth.js             # POST /api/auth/login, /logout
│       ├── dashboard.js        # GET /api/dashboard
│       ├── accounts.js         # CRUD /api/accounts
│       ├── cash.js             # CRUD /api/cash
│       ├── fd.js               # CRUD /api/fd
│       ├── rd.js               # CRUD /api/rd
│       ├── investments.js      # CRUD /api/investments
│       ├── transactions.js     # CRUD /api/transactions  (filters: type, month, category, paidVia)
│       ├── categories.js       # CRUD /api/categories
│       ├── creditcards.js      # CRUD /api/creditcards
│       ├── loans.js            # CRUD /api/loans
│       ├── epfo.js             # CRUD /api/epfo
│       ├── incometax.js        # CRUD /api/incometax
│       └── notes.js            # CRUD /api/notes
├── frontend/
│   ├── index.html              # Single-page app shell (all pages)
│   ├── login.html              # Login page
│   ├── css/style.css           # All styles
│   └── js/app.js               # All frontend logic
├── setup.bat                   # One-time npm install helper
├── start.bat                   # Start the backend server + open browser
└── README.md
```

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Authenticate with PIN (`{ pin }`) |
| POST | `/api/auth/logout` | Clear server session |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Full dashboard data — net worth, liabilities, trend, flow, alerts, summaries, pending actions |

### Modules (full CRUD)

| Method | Endpoint | Description |
|---|---|---|
| GET / POST | `/api/accounts` | List / create bank accounts |
| GET / PUT / DELETE | `/api/accounts/:id` | Read / update / delete a bank account |
| GET / POST | `/api/cash` | List / create cash holdings |
| GET / PUT / DELETE | `/api/cash/:id` | Read / update / delete a cash entry |
| GET / POST | `/api/fd` | List / create fixed deposits |
| GET / PUT / DELETE | `/api/fd/:id` | Read / update / delete an FD |
| GET / POST | `/api/rd` | List / create recurring deposits |
| GET / PUT / DELETE | `/api/rd/:id` | Read / update / delete an RD |
| GET / POST | `/api/investments` | List / create investments |
| GET / PUT / DELETE | `/api/investments/:id` | Read / update / delete an investment |
| GET / POST | `/api/transactions` | List (`?type=Income\|Expense&month=YYYY-MM&category=…&paidVia=…`) / create |
| GET / PUT / DELETE | `/api/transactions/:id` | Read / update / delete a transaction |
| GET / POST | `/api/categories` | List / create transaction categories |
| DELETE | `/api/categories/:id` | Delete a category |
| GET / POST | `/api/creditcards` | List / create credit cards |
| GET / PUT / DELETE | `/api/creditcards/:id` | Read / update / delete a credit card |
| GET / POST | `/api/loans` | List (`?type=Borrowed\|Lent`) / create loans |
| GET / PUT / DELETE | `/api/loans/:id` | Read / update / delete a loan |
| GET / POST | `/api/epfo` | List / create EPFO accounts |
| GET / PUT / DELETE | `/api/epfo/:id` | Read / update / delete an EPFO account |
| GET / POST | `/api/incometax` | List / create income tax records |
| GET / PUT / DELETE | `/api/incometax/:id` | Read / update / delete a tax record |
| GET / POST | `/api/notes` | List / create notes, payments, reminders, todos |
| GET / PUT / DELETE | `/api/notes/:id` | Read / update / delete a note |

---

## Entity-Relationship Diagram

```
┌─────────────────────┐          ┌──────────────────────────┐
│   BankAccounts      │◄────┐    │  TransactionCategories   │
│─────────────────────│     │    │──────────────────────────│
│ PK AccountID        │     │    │ PK CategoryID            │
│    Nickname         │     │    │    Type (Income|Expense)  │
│    BankName         │     │    │    Name                  │
│    AccountNumber    │     │    │    Icon                  │
│    AccountType      │     └────┤                          │
│    Balance          │          └──────────────┬───────────┘
│    InterestRate     │                         │ FK CategoryID (NOT NULL)
│    IsActive         │          ┌──────────────▼───────────┐
└──────────┬──────────┘          │      Transactions        │
           │ FK LinkedAccountID  │──────────────────────────│
           │ (optional)          │ PK TransactionID         │
           └────────────────────►│    Type                  │
                                 │    Amount                │
┌────────────────────┐           │    TransactionDate       │
│   CreditCards      │◄──────────┤    PaymentSource         │
│────────────────────│ FK        │ FK LinkedAccountID (NULL)│
│ PK CardID          │LinkedCard │ FK LinkedCardID (NULL)   │
│    Nickname        │ID (opt.)  │    Description           │
│    BankName        │           └──────────────────────────┘
│    CardNetwork     │
│    LastFourDigits  │    ┌─────────────────────┐
│    CreditLimit     │    │    CashHoldings     │
│    OutstandingAmt  │    │─────────────────────│
│    MinimumDue      │    │ PK CashID           │
│    BillingDate     │    │    Category         │
│    DueDate         │    │    Amount           │
│    AnnualFee       │    └─────────────────────┘
│    RewardPoints    │
│    InterestRate    │    ┌─────────────────────┐
└────────────────────┘    │   FixedDeposits     │
                          │─────────────────────│
┌────────────────────┐    │ PK FDID             │
│       Loans        │    │    Principal        │
│────────────────────│    │    InterestRate     │
│ PK LoanID          │    │    MaturityAmount   │
│    LoanType        │    │    InterestEarned*  │ (* computed)
│    PersonName      │    │    Status           │
│    PrincipalAmount │    └─────────────────────┘
│    OutstandingAmt  │
│    InterestRate    │    ┌─────────────────────┐
│    LoanDate        │    │ RecurringDeposits   │
│    DueDate         │    │─────────────────────│
│    Status          │    │ PK RDID             │
│ FK LinkedAccountID │    │    MonthlyInstall.  │
└────────────────────┘    │    TotalInstallments│
                          │    AmountDeposited* │ (* computed)
┌────────────────────┐    │    Status           │
│   EPFOAccounts     │    └─────────────────────┘
│────────────────────│
│ PK EPFOID          │    ┌─────────────────────┐
│    MemberName      │    │    Investments      │
│    UAN             │    │─────────────────────│
│    EmployerName    │    │ PK InvestmentID     │
│    Balance         │    │    Category         │
└────────────────────┘    │    InvestedAmount   │
                          │    CurrentValue     │
┌────────────────────┐    │    Units            │
│    IncomeTax       │    └─────────────────────┘
│────────────────────│
│ PK TaxID           │    ┌─────────────────────┐
│    FinancialYear   │    │       Notes         │
│    AssessmentYear  │    │─────────────────────│
│    GrossIncome     │    │ PK NoteID           │
│    TaxableIncome   │    │    Title            │
│    TDSDeducted     │    │    NoteType         │
│    AdvanceTax      │    │    Priority         │
│    SelfAssessTax   │    │    Status           │
│    TaxPaid         │    │    Amount           │
│    InterestAndFee  │    │    DueDate          │
│    Refund          │    │    Tags             │
│    FilingStatus    │    │    Body             │
└────────────────────┘    └─────────────────────┘
```

**Foreign Keys:**

| Child table | FK column | Parent table | Notes |
|---|---|---|---|
| `Transactions` | `CategoryID` | `TransactionCategories` | NOT NULL |
| `Transactions` | `LinkedAccountID` | `BankAccounts` | NULL — bank payment source |
| `Transactions` | `LinkedCardID` | `CreditCards` | NULL — credit card payment source |
| `Loans` | `LinkedAccountID` | `BankAccounts` | NULL — optional bank link |

**Views:**

| View | Source tables | Purpose |
|---|---|---|
| `vw_NetWorthSummary` | BankAccounts, CashHoldings, FixedDeposits, RecurringDeposits, Investments | Asset totals by category |
| `vw_MonthlyFlow` | Transactions | Monthly income / expense / net savings |
| `vw_FDMaturityAlert` | FixedDeposits | FDs maturing within 90 days |
| `vw_CurrentMonthExpenses` | Transactions, TransactionCategories | Current month expense breakdown by category |
| `vw_CreditCardSummary` | CreditCards | Adds UtilisationPct and AvailableLimit |

---

## Database Tables

### Core tables (created by `schema.sql`)

| Table | Description |
|---|---|
| `BankAccounts` | Savings/Current accounts — balance, interest rate, account number |
| `CashHoldings` | Physical cash categories with amounts |
| `FixedDeposits` | FD entries — principal, rate, start/maturity dates, maturity amount |
| `RecurringDeposits` | RD entries — monthly installment, total installments, expected maturity |
| `Investments` | All investment types — invested amount, current value, units |
| `TransactionCategories` | Income/Expense category master |
| `Transactions` | All income and expense entries — amount, date, category, payment source |

### Add-on tables (created by migration scripts)

| Table | Script | Description |
|---|---|---|
| `Loans` | `add_loans.sql` | Borrowed and lent money — principal, outstanding, interest, due date |
| `CreditCards` | `add_creditcards.sql` | Credit cards — limit, outstanding, minimum due, APR, reward points |
| `EPFOAccounts` | `add_epfo.sql` | Employee Provident Fund accounts — UAN, employer, balance |
| `IncomeTax` | `add_incometax.sql` + `add_incometax_interest.sql` | Year-wise income tax — gross/taxable income, TDS, advance tax, interest & fee payable, refund, filing status |
| `Notes` | `add_notes.sql` | Payment reminders, todos, notes — title, type, priority, status, amount, due date, tags, body |

### Views (created by `schema.sql`)

| View | Description |
|---|---|
| `vw_NetWorthSummary` | Total value grouped by asset category |
| `vw_MonthlyFlow` | Monthly income vs expense (all months) |
| `vw_FDMaturityAlert` | Fixed deposits maturing within 90 days |
| `vw_CurrentMonthExpenses` | Current month's expense totals by category |

---

## Dashboard Data

The `GET /api/dashboard` endpoint returns a single aggregated payload:

| Field | Description |
|---|---|
| `totalNetWorth` | Sum of all asset values (from `vw_NetWorthSummary`) |
| `totalLiabilities` | Credit card outstanding + loans borrowed |
| `totalIncome` | All-time total income from transactions |
| `totalExpense` | All-time total expenses from transactions |
| `netWorthTrend` | Last 6 months estimated net worth for the trend line chart |
| `netWorthBreakdown` | Per-category asset totals for the bar chart |
| `monthlyFlow` | Last 6 months income/expense for the bar chart |
| `fdAlerts` | FDs maturing within 90 days |
| `rdAlerts` | RDs maturing within 90 days |
| `expenseBreakdown` | Current month expenses by category (donut chart) |
| `bankAccounts` | Active bank accounts list |
| `cash` | All cash holdings |
| `fdSummary` | Active FD count, total principal, total maturity |
| `rdSummary` | Active RD count, total deposited, total expected maturity |
| `investmentSummary` | Total invested, total current value |
| `ccSummary` | Total credit limit, outstanding, reward points |
| `loanSummary` | Total borrowed outstanding, total lent outstanding |
| `epfoSummary` | Total EPFO balance |
| `taxSummary` | Total tax paid, total refunds, number of years filed |
| `recentTransactions` | Last 10 transactions |
| `pendingActions` | Pending Reminders & Todos for the dashboard action card |

---

## Payments & Notes Fields

Each record in `Notes` can represent a payment reminder, todo item, general note, or reminder:

| Field | Description |
|---|---|
| `Title` | Short description (e.g. "Pay electricity bill") |
| `NoteType` | `Payment`, `Todo`, `Reminder`, or `Note` |
| `Priority` | `High`, `Medium`, or `Low` |
| `Status` | `Pending`, `Done`, or `Snoozed` |
| `Amount` | Optional amount due (₹) |
| `DueDate` | Optional due date |
| `Tags` | Comma-separated tags (e.g. `bills, monthly, credit card`) |
| `Body` | Free-text notes or details |

Items of type **Reminder** or **Todo** with status **Pending** or **Snoozed** automatically appear on the dashboard action card so you can act on them without navigating away.

---

## Income Tax Fields

Each record in `IncomeTax` tracks a complete picture of one financial year:

| Field | Description |
|---|---|
| `FinancialYear` | e.g. `2023-24` |
| `AssessmentYear` | e.g. `2024-25` (auto-suggested in UI) |
| `TaxRegime` | `New` or `Old` |
| `GrossIncome` | Total income before deductions |
| `TaxableIncome` | Income after all deductions |
| `TDSDeducted` | Tax deducted at source by employer/bank |
| `AdvanceTax` | Advance tax paid during the year |
| `SelfAssessTax` | Self-assessment tax paid at filing time |
| `TaxPaid` | Total tax actually paid (TDS + Advance + Self-Assess) |
| `InterestAndFee` | Interest and late fees payable — e.g. u/s 234A, 234B, 234C or late filing fee |
| `Refund` | Refund received from IT department |
| `FilingStatus` | `Filed`, `Pending`, or `Not Applicable` |
| `FilingDate` | Date ITR was filed |
| `AcknowledgmentNo` | ITR acknowledgment number |

---

## Migration Scripts Reference

All scripts in `db/` are safe to re-run. Run them in the order listed during fresh setup.

| Script | What it does | Safe to re-run |
|---|---|---|
| `schema.sql` | Creates the `FinanceTracker` database, all core tables, views, and seed data | Yes — wrapped in `IF NOT EXISTS` |
| `add_payment_source.sql` | Adds `PaymentSource` column to `Transactions` | Yes |
| `add_loans.sql` | Creates `Loans` table | Yes |
| `add_creditcards.sql` | Creates `CreditCards` table | Yes |
| `add_epfo.sql` | Creates `EPFOAccounts` table | Yes |
| `add_incometax.sql` | Creates `IncomeTax` table | Yes |
| `add_incometax_interest.sql` | Adds `InterestAndFee` column to `IncomeTax` | Yes |
| `add_notes.sql` | Creates `Notes` table for Payments & Notes module | Yes |
| `add_credit_card_bill_category.sql` | Adds `Credit Card Bill` to expense categories | Yes |
| `add_categories.sql` | Adds extended Income & Expense categories (Electricity, Mobile Recharge, Groceries, Freelance, etc.) | Yes |
| `fix_icons.sql` | Clears emoji icons from DB (rendered client-side instead) | Yes |
| `create_login.sql` | Creates a SQL Server login for SQL Auth mode | Manual — edit before running |
| `enable_mixed_auth.sql` | Enables SQL Server mixed-mode authentication | One-time system change |

---

## Changelog

### v1.4 — Per-section Privacy Toggle
- **🔒 Independent show/hide per section** — each page now has its own 👁 Show/Hide button in the section header. Revealing values on one page (e.g. Bank Accounts) does not affect any other page. The global topbar toggle has been replaced.

### v1.3 — Transaction Filters & Extended Categories
- **🔍 Column filters on transactions** — Date (month), Type, Category, and Paid Via filters added to the Income & Expenses table. Category dropdown narrows automatically when Type is selected.
- **📂 Extended categories** — 17 new categories added: Electricity 💡, Mobile Recharge 📱, Internet 🌐, Gas/LPG 🔥, Water Bill 💧, Groceries 🛒, Healthcare 🏥, Education 📚, Subscriptions 📺, Fuel ⛽, Dining Out 🍴, Entertainment 🎬, Home Maintenance 🔧, Personal Care 🧴, Gifts & Donations 🤝, Taxes & Fees 🏛, EMI 🏦 (Expense); plus Freelance, Rental Income, Dividends, Cashback & Rewards, Gifts Received, Refund (Income).

### v1.2 — Credit Card Edit on Tile
- **✏️ Edit button on card tiles** — each visual credit card tile now has a pencil button in the top-right corner, opening the full edit modal directly from the card without scrolling to the table.

### v1.1 — Notes, Net Worth Trend & Masking
- **📝 Payments & Notes** — new full module: track payment reminders, todos, notes with priority, due date, tags, and amount. Items surface on dashboard for quick action.
- **📈 Net Worth Trend Chart** — SVG line chart on dashboard showing 6-month estimated net worth history with direction indicator (green/red).
- **💸 Expense Impact** — dashboard hero card shows all-time net savings/spending context. Breakdown card shows total income vs total expense rows.
- **🔔 Reminders & Todos card** — pending Reminders/Todos from the Notes module appear as an action card on the dashboard with one-click Mark Done.
- **🔒 Sensitive field masking** — bank account numbers, credit card last-4 digits, and EPFO UAN are masked by default alongside financial values.
- **🔔 Bell icon** — maturity alert cards and headers updated from ⚠️ warning to 🔔 bell icon.
- **Desktop shortcut** — `start.bat` updated to wait for server readiness before opening the browser.
