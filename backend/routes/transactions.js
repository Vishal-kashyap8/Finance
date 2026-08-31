const router  = require('express').Router();
const { getPool, sql } = require('../db');

function sourceEffect(tx) {
  const amount = Number(tx.Amount || 0);
  if (!amount) return null;

  if (tx.PaymentSource === 'Bank Account' && tx.LinkedAccountID) {
    return {
      table: 'BankAccounts',
      id: Number(tx.LinkedAccountID),
      delta: tx.Type === 'Income' ? amount : -amount,
    };
  }

  if (tx.PaymentSource === 'Credit Card' && tx.LinkedCardID) {
    return {
      table: 'CreditCards',
      id: Number(tx.LinkedCardID),
      delta: tx.Type === 'Income' ? -amount : amount,
    };
  }

  return null;
}

async function applySourceEffect(request, tx, multiplier = 1) {
  const effect = sourceEffect(tx);
  if (!effect) return;

  const delta = effect.delta * multiplier;

  if (effect.table === 'BankAccounts') {
    const result = await request
      .input('accountId', sql.Int, effect.id)
      .input('accountDelta', sql.Decimal(18, 2), delta)
      .query(`
        UPDATE dbo.BankAccounts
        SET Balance = Balance + @accountDelta,
            LastUpdated = GETDATE()
        WHERE AccountID = @accountId
      `);
    if (!result.rowsAffected[0]) throw new Error('Selected bank account was not found');
    return;
  }

  if (effect.table === 'CreditCards') {
    const result = await request
      .input('cardId', sql.Int, effect.id)
      .input('cardDelta', sql.Decimal(18, 2), delta)
      .query(`
        UPDATE dbo.CreditCards
        SET OutstandingAmt = OutstandingAmt + @cardDelta,
            LastUpdated = GETDATE()
        WHERE CardID = @cardId
      `);
    if (!result.rowsAffected[0]) throw new Error('Selected credit card was not found');
  }
}

function txFromBody(body) {
  const { Type, CategoryID, Amount, TransactionDate, Description,
          PaymentSource, LinkedAccountID, LinkedCardID } = body;
  return {
    Type,
    CategoryID,
    Amount,
    TransactionDate,
    Description,
    PaymentSource: PaymentSource || null,
    LinkedAccountID: PaymentSource === 'Bank Account' ? (LinkedAccountID || null) : null,
    LinkedCardID: PaymentSource === 'Credit Card' ? (LinkedCardID || null) : null,
  };
}

// GET with optional ?type=Income|Expense and ?month=YYYY-MM
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    let query = `
      SELECT t.TransactionID, t.Type, t.CategoryID, tc.Name AS Category, tc.Icon,
             t.Amount, t.TransactionDate, t.Description,
             t.LinkedAccountID, t.PaymentSource, t.LinkedCardID,
             ba.Nickname  AS LinkedAccountName,
             cc.Nickname  AS LinkedCardName
      FROM dbo.Transactions t
      JOIN dbo.TransactionCategories tc ON t.CategoryID = tc.CategoryID
      LEFT JOIN dbo.BankAccounts  ba ON t.LinkedAccountID = ba.AccountID
      LEFT JOIN dbo.CreditCards   cc ON t.LinkedCardID    = cc.CardID
      WHERE 1=1
    `;
    const request = pool.request();
    if (req.query.type) {
      query += ` AND t.Type = @type`;
      request.input('type', sql.NVarChar(10), req.query.type);
    }
    if (req.query.month) {
      const [yr, mo] = req.query.month.split('-');
      query += ` AND YEAR(t.TransactionDate)=@yr AND MONTH(t.TransactionDate)=@mo`;
      request.input('yr', sql.Int, parseInt(yr));
      request.input('mo', sql.Int, parseInt(mo));
    }
    if (req.query.category) {
      query += ` AND tc.Name = @category`;
      request.input('category', sql.NVarChar(100), req.query.category);
    }
    if (req.query.paidVia) {
      if (req.query.paidVia === 'Bank Account') {
        query += ` AND t.PaymentSource = 'Bank Account'`;
      } else if (req.query.paidVia === 'Credit Card') {
        query += ` AND t.PaymentSource = 'Credit Card'`;
      } else {
        query += ` AND t.PaymentSource = @paidVia`;
        request.input('paidVia', sql.NVarChar(30), req.query.paidVia);
      }
    }
    query += ` ORDER BY t.TransactionDate DESC, t.TransactionID DESC`;
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const tx = txFromBody(req.body);
  const dbTx = new sql.Transaction(await getPool());
  try {
    await dbTx.begin();
    const result = await new sql.Request(dbTx)
      .input('Type',            sql.NVarChar(10),  tx.Type)
      .input('CategoryID',      sql.Int,           tx.CategoryID)
      .input('Amount',          sql.Decimal(18,2), tx.Amount)
      .input('TransactionDate', sql.Date,          tx.TransactionDate || new Date())
      .input('Description',     sql.NVarChar(500), tx.Description || null)
      .input('PaymentSource',   sql.NVarChar(30),  tx.PaymentSource)
      .input('LinkedAccountID', sql.Int,           tx.LinkedAccountID)
      .input('LinkedCardID',    sql.Int,           tx.LinkedCardID)
      .query(`
        INSERT INTO dbo.Transactions
          (Type, CategoryID, Amount, TransactionDate, Description, PaymentSource, LinkedAccountID, LinkedCardID)
        OUTPUT INSERTED.*
        VALUES (@Type,@CategoryID,@Amount,@TransactionDate,@Description,@PaymentSource,@LinkedAccountID,@LinkedCardID)
      `);
    await applySourceEffect(new sql.Request(dbTx), tx);
    await dbTx.commit();
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    if (dbTx._aborted !== true) await dbTx.rollback().catch(() => {});
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const tx = txFromBody(req.body);
  const dbTx = new sql.Transaction(await getPool());
  try {
    await dbTx.begin();
    const existing = await new sql.Request(dbTx)
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT Type, Amount, PaymentSource, LinkedAccountID, LinkedCardID
        FROM dbo.Transactions
        WHERE TransactionID=@id
      `);
    if (!existing.recordset.length) {
      await dbTx.rollback();
      return res.status(404).json({ error: 'Not found' });
    }

    await applySourceEffect(new sql.Request(dbTx), existing.recordset[0], -1);

    const result = await new sql.Request(dbTx)
      .input('id',              sql.Int,           req.params.id)
      .input('Type',            sql.NVarChar(10),  tx.Type)
      .input('CategoryID',      sql.Int,           tx.CategoryID)
      .input('Amount',          sql.Decimal(18,2), tx.Amount)
      .input('TransactionDate', sql.Date,          tx.TransactionDate)
      .input('Description',     sql.NVarChar(500), tx.Description || null)
      .input('PaymentSource',   sql.NVarChar(30),  tx.PaymentSource)
      .input('LinkedAccountID', sql.Int,           tx.LinkedAccountID)
      .input('LinkedCardID',    sql.Int,           tx.LinkedCardID)
      .query(`
        UPDATE dbo.Transactions
        SET Type=@Type, CategoryID=@CategoryID, Amount=@Amount,
            TransactionDate=@TransactionDate, Description=@Description,
            PaymentSource=@PaymentSource, LinkedAccountID=@LinkedAccountID,
            LinkedCardID=@LinkedCardID
        OUTPUT INSERTED.*
        WHERE TransactionID=@id
      `);
    await applySourceEffect(new sql.Request(dbTx), tx);
    await dbTx.commit();
    res.json(result.recordset[0]);
  } catch (err) {
    if (dbTx._aborted !== true) await dbTx.rollback().catch(() => {});
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const dbTx = new sql.Transaction(await getPool());
  try {
    await dbTx.begin();
    const existing = await new sql.Request(dbTx)
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT Type, Amount, PaymentSource, LinkedAccountID, LinkedCardID
        FROM dbo.Transactions
        WHERE TransactionID=@id
      `);
    if (!existing.recordset.length) {
      await dbTx.rollback();
      return res.status(404).json({ error: 'Not found' });
    }

    await applySourceEffect(new sql.Request(dbTx), existing.recordset[0], -1);
    await new sql.Request(dbTx)
      .input('id', sql.Int, req.params.id)
      .query(`DELETE FROM dbo.Transactions WHERE TransactionID=@id`);
    await dbTx.commit();
    res.json({ message: 'Deleted' });
  } catch (err) {
    if (dbTx._aborted !== true) await dbTx.rollback().catch(() => {});
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
