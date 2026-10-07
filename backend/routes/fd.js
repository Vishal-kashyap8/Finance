const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db');

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`SELECT * FROM dbo.FixedDeposits ORDER BY MaturityDate`);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/accounts', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT AccountID, Nickname, BankName, AccountType, Balance
      FROM dbo.BankAccounts
      WHERE IsActive = 1
      ORDER BY BankName, Nickname
    `);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT * FROM dbo.FixedDeposits WHERE FDID=@id`);
    if (!result.recordset.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { BankName, AccountRef, LinkedAccountID, Principal, InterestRate, StartDate, MaturityDate, MaturityAmount, Status, Notes } = req.body;
  if (!LinkedAccountID || Number(Principal) <= 0) {
    return res.status(400).json({ error: 'Select a funding account and provide a positive principal amount.' });
  }

  const dbTx = new sql.Transaction(await getPool());
  try {
    await dbTx.begin();
    const accountResult = await new sql.Request(dbTx)
      .input('accountId', sql.Int, Number(LinkedAccountID))
      .input('principal', sql.Decimal(18, 2), Number(Principal))
      .query(`
        UPDATE dbo.BankAccounts
        SET Balance = Balance - @principal,
            LastUpdated = GETDATE()
        WHERE AccountID = @accountId
          AND Balance >= @principal
      `);
    if (!accountResult.rowsAffected[0]) {
      throw new Error('Selected account does not have enough balance for this FD.');
    }

    const result = await new sql.Request(dbTx)
      .input('BankName',       sql.NVarChar(100), BankName)
      .input('AccountRef',     sql.NVarChar(100), AccountRef || null)
      .input('LinkedAccountID', sql.Int, Number(LinkedAccountID))
      .input('Principal',      sql.Decimal(18,2), Principal)
      .input('InterestRate',   sql.Decimal(5,2),  InterestRate)
      .input('StartDate',      sql.Date,          StartDate)
      .input('MaturityDate',   sql.Date,          MaturityDate)
      .input('MaturityAmount', sql.Decimal(18,2), MaturityAmount)
      .input('Status',         sql.NVarChar(10),  Status || 'Active')
      .input('Notes',          sql.NVarChar(500), Notes || null)
      .query(`
        INSERT INTO dbo.FixedDeposits (BankName, AccountRef, LinkedAccountID, Principal, InterestRate, StartDate, MaturityDate, MaturityAmount, Status, Notes)
        OUTPUT INSERTED.*
        VALUES (@BankName, @AccountRef, @LinkedAccountID, @Principal, @InterestRate, @StartDate, @MaturityDate, @MaturityAmount, @Status, @Notes)
      `);
    await dbTx.commit();
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    if (dbTx._aborted !== true) await dbTx.rollback().catch(() => {});
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { BankName, AccountRef, LinkedAccountID, Principal, InterestRate, StartDate, MaturityDate, MaturityAmount, Status, Notes } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id',             sql.Int,           req.params.id)
      .input('BankName',       sql.NVarChar(100), BankName)
      .input('AccountRef',     sql.NVarChar(100), AccountRef || null)
      .input('LinkedAccountID', sql.Int,           LinkedAccountID || null)
      .input('Principal',      sql.Decimal(18,2), Principal)
      .input('InterestRate',   sql.Decimal(5,2),  InterestRate)
      .input('StartDate',      sql.Date,          StartDate)
      .input('MaturityDate',   sql.Date,          MaturityDate)
      .input('MaturityAmount', sql.Decimal(18,2), MaturityAmount)
      .input('Status',         sql.NVarChar(10),  Status)
      .input('Notes',          sql.NVarChar(500), Notes || null)
      .query(`
        UPDATE dbo.FixedDeposits
        SET BankName=@BankName, AccountRef=@AccountRef, LinkedAccountID=@LinkedAccountID,
            Principal=@Principal, InterestRate=@InterestRate, StartDate=@StartDate,
            MaturityDate=@MaturityDate, MaturityAmount=@MaturityAmount,
            Status=@Status, Notes=@Notes
        OUTPUT INSERTED.*
        WHERE FDID=@id
      `);
    if (!result.recordset.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`DELETE FROM dbo.FixedDeposits WHERE FDID=@id`);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
