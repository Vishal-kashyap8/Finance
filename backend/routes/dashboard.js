const express = require('express');
const router  = express.Router();
const { getPool } = require('../db');

// Safe query helper: returns an empty recordset instead of throwing when
// optional migration tables are not installed yet.
async function safeQuery(pool, queryStr, fallback = []) {
  try {
    const r = await pool.request().query(queryStr);
    return r.recordset;
  } catch (_) { return fallback; }
}

function money(value) {
  return parseFloat(value || 0) || 0;
}

function buildNetWorthTrend(monthlyFlowRows, totalNetWorth) {
  const rows = monthlyFlowRows.slice().reverse();
  return rows.map((row, index) => {
    const futureNetSavings = rows
      .slice(index + 1)
      .reduce((sum, r) => sum + money(r.NetSavings), 0);
    const monthDate = new Date(Number(row.Yr), Number(row.Mo) - 1, 1);

    return {
      Yr: row.Yr,
      Mo: row.Mo,
      MonthLabel: monthDate.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      EstimatedNetWorth: totalNetWorth - futureNetSavings,
    };
  });
}

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();

    // Gross assets by category. Core assets come from the view; optional
    // modules are appended here so they count in net worth too.
    const netWorthRows = await safeQuery(pool, `SELECT * FROM dbo.vw_NetWorthSummary`);

    const epfoRows = await safeQuery(pool, `
      SELECT ISNULL(SUM(Balance),0) AS TotalBalance
      FROM dbo.EPFOAccounts`);
    const epfoSummary = epfoRows[0] || { TotalBalance: 0 };
    const loanRows = await safeQuery(pool, `
      SELECT ISNULL(SUM(CASE WHEN LoanType='Borrowed' THEN OutstandingAmount ELSE 0 END),0) AS TotalBorrowed,
             ISNULL(SUM(CASE WHEN LoanType='Lent'     THEN OutstandingAmount ELSE 0 END),0) AS TotalLent
      FROM dbo.Loans WHERE Status IN ('Active','Partial')`);
    const loanSummary = loanRows[0] || { TotalBorrowed: 0, TotalLent: 0 };
    const lentTotal = money(loanSummary.TotalLent);
    if (lentTotal) netWorthRows.push({ Category: 'Money Lent Out', TotalValue: lentTotal });

    const totalAssets = netWorthRows.reduce((sum, r) => sum + money(r.TotalValue), 0);

    // Monthly flow (last 6 months)
    const monthlyFlowRows = await safeQuery(pool, `
      SELECT TOP 6 Yr, Mo, TotalIncome, TotalExpense, NetSavings
      FROM dbo.vw_MonthlyFlow ORDER BY Yr DESC, Mo DESC`);

    // FD maturity alerts
    const fdAlerts = await safeQuery(pool, `SELECT * FROM dbo.vw_FDMaturityAlert ORDER BY DaysToMaturity`);

    // RD maturity alerts (maturing within 90 days)
    const rdAlerts = await safeQuery(pool, `
      SELECT RDID, BankName, AccountRef, MonthlyInstallment, InterestRate,
             MaturityDate, ExpectedMaturityAmount, AmountDeposited,
             TotalInstallments, InstallmentsPaid,
             DATEDIFF(DAY, GETDATE(), MaturityDate) AS DaysToMaturity
      FROM dbo.RecurringDeposits
      WHERE Status='Active' AND MaturityDate <= DATEADD(DAY, 90, GETDATE())
      ORDER BY MaturityDate`);

    // Current month expense breakdown
    const expBreakdown = await safeQuery(pool, `SELECT * FROM dbo.vw_CurrentMonthExpenses ORDER BY TotalAmount DESC`);

    // Bank accounts
    const accounts = await safeQuery(pool, `SELECT * FROM dbo.BankAccounts WHERE IsActive=1 ORDER BY BankName`);

    // Cash
    const cash = await safeQuery(pool, `SELECT * FROM dbo.CashHoldings ORDER BY Category`);

    // FD summary
    const fdSumRows = await safeQuery(pool, `
      SELECT COUNT(*) AS Count,
             ISNULL(SUM(Principal),0)      AS TotalPrincipal,
             ISNULL(SUM(MaturityAmount),0) AS TotalMaturity
      FROM dbo.FixedDeposits WHERE Status='Active'`);
    const fdSummary = fdSumRows[0] || { Count: 0, TotalPrincipal: 0, TotalMaturity: 0 };

    // RD summary
    const rdSumRows = await safeQuery(pool, `
      SELECT COUNT(*) AS Count,
             ISNULL(SUM(AmountDeposited),0)         AS TotalDeposited,
             ISNULL(SUM(ExpectedMaturityAmount),0)  AS TotalMaturity
      FROM dbo.RecurringDeposits WHERE Status='Active'`);
    const rdSummary = rdSumRows[0] || { Count: 0, TotalDeposited: 0, TotalMaturity: 0 };

    // Investments
    const invRows = await safeQuery(pool, `
      SELECT ISNULL(SUM(InvestedAmount),0) AS TotalInvested,
             ISNULL(SUM(CurrentValue),0)   AS TotalCurrentValue
      FROM dbo.Investments`);
    const investmentSummary = invRows[0] || { TotalInvested: 0, TotalCurrentValue: 0 };

    // Recent 10 transactions
    const recentTx = await safeQuery(pool, `
      SELECT TOP 10 t.TransactionID, t.Type, tc.Name AS Category,
             t.Amount, t.TransactionDate, t.Description
      FROM dbo.Transactions t
      JOIN dbo.TransactionCategories tc ON t.CategoryID = tc.CategoryID
      ORDER BY t.TransactionDate DESC, t.TransactionID DESC`);

    // Credit cards summary
    const ccRows = await safeQuery(pool, `
      SELECT COUNT(*) AS Count,
             ISNULL(SUM(CreditLimit),0)    AS TotalLimit,
             ISNULL(SUM(OutstandingAmt),0) AS TotalOutstanding,
             ISNULL(SUM(RewardPoints),0)   AS TotalPoints
      FROM dbo.CreditCards WHERE IsActive=1`);
    const ccSummary = ccRows[0] || { Count: 0, TotalLimit: 0, TotalOutstanding: 0, TotalPoints: 0 };

    // Income tax summary
    const taxRows = await safeQuery(pool, `
      SELECT ISNULL(SUM(TaxPaid),0)  AS TotalTaxPaid,
             ISNULL(SUM(Refund),0)   AS TotalRefund,
             COUNT(*)                AS TotalYears
      FROM dbo.IncomeTax`);
    const taxSummary = taxRows[0] || { TotalTaxPaid: 0, TotalRefund: 0, TotalYears: 0 };

    const totalLiabilities = money(ccSummary.TotalOutstanding) + money(loanSummary.TotalBorrowed);
    const totalNetWorth = totalAssets - totalLiabilities;
    const trendRows = buildNetWorthTrend(monthlyFlowRows, totalNetWorth);

    // Pending Reminders & Todos for dashboard widget
    const pendingActions = await safeQuery(pool, `
      SELECT NoteID, Title, NoteType, Priority, DueDate, Amount, Tags, Body
      FROM dbo.Notes
      WHERE NoteType IN ('Reminder','Todo')
        AND Status <> 'Done'
      ORDER BY
        CASE Priority WHEN 'High' THEN 0 WHEN 'Medium' THEN 1 ELSE 2 END,
        DueDate ASC, CreatedAt DESC`);

    // Cash/bank balances are already affected by transactions, so income/expense
    // totals are shown as context only and are not subtracted from net worth again.
    const allTimeFlow = await safeQuery(pool, `
      SELECT
        ISNULL(SUM(CASE WHEN Type='Income'  THEN Amount ELSE 0 END),0) AS TotalIncome,
        ISNULL(SUM(CASE WHEN Type='Expense' THEN Amount ELSE 0 END),0) AS TotalExpense
      FROM dbo.Transactions`);
    const totalIncome  = money((allTimeFlow[0] || {}).TotalIncome);
    const totalExpense = money((allTimeFlow[0] || {}).TotalExpense);

    res.json({
      totalAssets,
      totalNetWorth,
      totalLiabilities,
      totalIncome,
      totalExpense,
      pendingActions,
      netWorthTrend:    trendRows,
      netWorthBreakdown: netWorthRows,
      monthlyFlow:      monthlyFlowRows.reverse(),
      fdAlerts,
      rdAlerts,
      expenseBreakdown: expBreakdown,
      bankAccounts:     accounts,
      cash,
      fdSummary,
      rdSummary,
      investmentSummary,
      recentTransactions: recentTx,
      ccSummary,
      loanSummary,
      epfoSummary,
      taxSummary,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
