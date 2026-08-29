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
  const { BankName, AccountRef, Principal, InterestRate, StartDate, MaturityDate, MaturityAmount, Status, Notes } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('BankName',       sql.NVarChar(100), BankName)
      .input('AccountRef',     sql.NVarChar(100), AccountRef || null)
      .input('Principal',      sql.Decimal(18,2), Principal)
      .input('InterestRate',   sql.Decimal(5,2),  InterestRate)
      .input('StartDate',      sql.Date,          StartDate)
      .input('MaturityDate',   sql.Date,          MaturityDate)
      .input('MaturityAmount', sql.Decimal(18,2), MaturityAmount)
      .input('Status',         sql.NVarChar(10),  Status || 'Active')
      .input('Notes',          sql.NVarChar(500), Notes || null)
      .query(`
        INSERT INTO dbo.FixedDeposits (BankName, AccountRef, Principal, InterestRate, StartDate, MaturityDate, MaturityAmount, Status, Notes)
        OUTPUT INSERTED.*
        VALUES (@BankName, @AccountRef, @Principal, @InterestRate, @StartDate, @MaturityDate, @MaturityAmount, @Status, @Notes)
      `);
    res.status(201).json(result.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  const { BankName, AccountRef, Principal, InterestRate, StartDate, MaturityDate, MaturityAmount, Status, Notes } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id',             sql.Int,           req.params.id)
      .input('BankName',       sql.NVarChar(100), BankName)
      .input('AccountRef',     sql.NVarChar(100), AccountRef || null)
      .input('Principal',      sql.Decimal(18,2), Principal)
      .input('InterestRate',   sql.Decimal(5,2),  InterestRate)
      .input('StartDate',      sql.Date,          StartDate)
      .input('MaturityDate',   sql.Date,          MaturityDate)
      .input('MaturityAmount', sql.Decimal(18,2), MaturityAmount)
      .input('Status',         sql.NVarChar(10),  Status)
      .input('Notes',          sql.NVarChar(500), Notes || null)
      .query(`
        UPDATE dbo.FixedDeposits
        SET BankName=@BankName, AccountRef=@AccountRef, Principal=@Principal,
            InterestRate=@InterestRate, StartDate=@StartDate, MaturityDate=@MaturityDate,
            MaturityAmount=@MaturityAmount, Status=@Status, Notes=@Notes
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
