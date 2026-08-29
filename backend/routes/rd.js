const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db');

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`SELECT * FROM dbo.RecurringDeposits ORDER BY MaturityDate`);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT * FROM dbo.RecurringDeposits WHERE RDID=@id`);
    if (!result.recordset.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { BankName, AccountRef, MonthlyInstallment, InterestRate, StartDate, MaturityDate,
          TotalInstallments, InstallmentsPaid, ExpectedMaturityAmount, Status, Notes } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('BankName',               sql.NVarChar(100), BankName)
      .input('AccountRef',             sql.NVarChar(100), AccountRef || null)
      .input('MonthlyInstallment',     sql.Decimal(18,2), MonthlyInstallment)
      .input('InterestRate',           sql.Decimal(5,2),  InterestRate)
      .input('StartDate',              sql.Date,          StartDate)
      .input('MaturityDate',           sql.Date,          MaturityDate)
      .input('TotalInstallments',      sql.Int,           TotalInstallments)
      .input('InstallmentsPaid',       sql.Int,           InstallmentsPaid || 0)
      .input('ExpectedMaturityAmount', sql.Decimal(18,2), ExpectedMaturityAmount)
      .input('Status',                 sql.NVarChar(10),  Status || 'Active')
      .input('Notes',                  sql.NVarChar(500), Notes || null)
      .query(`
        INSERT INTO dbo.RecurringDeposits
          (BankName, AccountRef, MonthlyInstallment, InterestRate, StartDate, MaturityDate,
           TotalInstallments, InstallmentsPaid, ExpectedMaturityAmount, Status, Notes)
        OUTPUT INSERTED.*
        VALUES (@BankName, @AccountRef, @MonthlyInstallment, @InterestRate, @StartDate, @MaturityDate,
                @TotalInstallments, @InstallmentsPaid, @ExpectedMaturityAmount, @Status, @Notes)
      `);
    res.status(201).json(result.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  const { BankName, AccountRef, MonthlyInstallment, InterestRate, StartDate, MaturityDate,
          TotalInstallments, InstallmentsPaid, ExpectedMaturityAmount, Status, Notes } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id',                     sql.Int,           req.params.id)
      .input('BankName',               sql.NVarChar(100), BankName)
      .input('AccountRef',             sql.NVarChar(100), AccountRef || null)
      .input('MonthlyInstallment',     sql.Decimal(18,2), MonthlyInstallment)
      .input('InterestRate',           sql.Decimal(5,2),  InterestRate)
      .input('StartDate',              sql.Date,          StartDate)
      .input('MaturityDate',           sql.Date,          MaturityDate)
      .input('TotalInstallments',      sql.Int,           TotalInstallments)
      .input('InstallmentsPaid',       sql.Int,           InstallmentsPaid)
      .input('ExpectedMaturityAmount', sql.Decimal(18,2), ExpectedMaturityAmount)
      .input('Status',                 sql.NVarChar(10),  Status)
      .input('Notes',                  sql.NVarChar(500), Notes || null)
      .query(`
        UPDATE dbo.RecurringDeposits
        SET BankName=@BankName, AccountRef=@AccountRef, MonthlyInstallment=@MonthlyInstallment,
            InterestRate=@InterestRate, StartDate=@StartDate, MaturityDate=@MaturityDate,
            TotalInstallments=@TotalInstallments, InstallmentsPaid=@InstallmentsPaid,
            ExpectedMaturityAmount=@ExpectedMaturityAmount, Status=@Status, Notes=@Notes
        OUTPUT INSERTED.*
        WHERE RDID=@id
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
      .query(`DELETE FROM dbo.RecurringDeposits WHERE RDID=@id`);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
