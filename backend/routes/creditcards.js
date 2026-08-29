const express = require('express');
const router  = express.Router();
const { getPool, sql } = require('../db');

// GET all
router.get('/', async (req, res) => {
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .query(`SELECT *, CreditLimit - OutstandingAmt AS AvailableLimit,
              CASE WHEN CreditLimit > 0 THEN CAST(OutstandingAmt/CreditLimit*100 AS DECIMAL(5,1)) ELSE 0 END AS UtilisationPct
              FROM dbo.CreditCards ORDER BY BankName, Nickname`);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single
router.get('/:id', async (req, res) => {
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT *, CreditLimit - OutstandingAmt AS AvailableLimit,
              CASE WHEN CreditLimit > 0 THEN CAST(OutstandingAmt/CreditLimit*100 AS DECIMAL(5,1)) ELSE 0 END AS UtilisationPct
              FROM dbo.CreditCards WHERE CardID=@id`);
    if (!result.recordset.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create
router.post('/', async (req, res) => {
  const { Nickname, BankName, CardNetwork, LastFourDigits, CreditLimit,
          OutstandingAmt, MinimumDue, BillingDate, DueDate,
          AnnualFee, RewardPoints, InterestRate, Notes } = req.body;
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('Nickname',       sql.NVarChar(100), Nickname)
      .input('BankName',       sql.NVarChar(100), BankName)
      .input('CardNetwork',    sql.NVarChar(20),  CardNetwork || 'Visa')
      .input('LastFourDigits', sql.Char(4),        LastFourDigits || null)
      .input('CreditLimit',    sql.Decimal(18,2),  CreditLimit)
      .input('OutstandingAmt', sql.Decimal(18,2),  OutstandingAmt || 0)
      .input('MinimumDue',     sql.Decimal(18,2),  MinimumDue || 0)
      .input('BillingDate',    sql.Int,             BillingDate || null)
      .input('DueDate',        sql.Int,             DueDate || null)
      .input('AnnualFee',      sql.Decimal(18,2),  AnnualFee || 0)
      .input('RewardPoints',   sql.Int,             RewardPoints || 0)
      .input('InterestRate',   sql.Decimal(5,2),   InterestRate || null)
      .input('Notes',          sql.NVarChar(500),  Notes || null)
      .query(`INSERT INTO dbo.CreditCards
                (Nickname,BankName,CardNetwork,LastFourDigits,CreditLimit,OutstandingAmt,
                 MinimumDue,BillingDate,DueDate,AnnualFee,RewardPoints,InterestRate,Notes)
              OUTPUT INSERTED.*
              VALUES (@Nickname,@BankName,@CardNetwork,@LastFourDigits,@CreditLimit,@OutstandingAmt,
                      @MinimumDue,@BillingDate,@DueDate,@AnnualFee,@RewardPoints,@InterestRate,@Notes)`);
    res.status(201).json(result.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update
router.put('/:id', async (req, res) => {
  const { Nickname, BankName, CardNetwork, LastFourDigits, CreditLimit,
          OutstandingAmt, MinimumDue, BillingDate, DueDate,
          AnnualFee, RewardPoints, InterestRate, IsActive, Notes } = req.body;
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('id',             sql.Int,            req.params.id)
      .input('Nickname',       sql.NVarChar(100),  Nickname)
      .input('BankName',       sql.NVarChar(100),  BankName)
      .input('CardNetwork',    sql.NVarChar(20),   CardNetwork || 'Visa')
      .input('LastFourDigits', sql.Char(4),         LastFourDigits || null)
      .input('CreditLimit',    sql.Decimal(18,2),   CreditLimit)
      .input('OutstandingAmt', sql.Decimal(18,2),   OutstandingAmt || 0)
      .input('MinimumDue',     sql.Decimal(18,2),   MinimumDue || 0)
      .input('BillingDate',    sql.Int,              BillingDate || null)
      .input('DueDate',        sql.Int,              DueDate || null)
      .input('AnnualFee',      sql.Decimal(18,2),   AnnualFee || 0)
      .input('RewardPoints',   sql.Int,              RewardPoints || 0)
      .input('InterestRate',   sql.Decimal(5,2),    InterestRate || null)
      .input('IsActive',       sql.Bit,              IsActive !== undefined ? IsActive : 1)
      .input('Notes',          sql.NVarChar(500),   Notes || null)
      .query(`UPDATE dbo.CreditCards
              SET Nickname=@Nickname, BankName=@BankName, CardNetwork=@CardNetwork,
                  LastFourDigits=@LastFourDigits, CreditLimit=@CreditLimit,
                  OutstandingAmt=@OutstandingAmt, MinimumDue=@MinimumDue,
                  BillingDate=@BillingDate, DueDate=@DueDate, AnnualFee=@AnnualFee,
                  RewardPoints=@RewardPoints, InterestRate=@InterestRate,
                  IsActive=@IsActive, Notes=@Notes, LastUpdated=GETDATE()
              OUTPUT INSERTED.*
              WHERE CardID=@id`);
    if (!result.recordset.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`DELETE FROM dbo.CreditCards WHERE CardID=@id`);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
