const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db');

// GET all accounts
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`SELECT * FROM dbo.BankAccounts ORDER BY BankName, Nickname`);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single
router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT * FROM dbo.BankAccounts WHERE AccountID=@id`);
    if (!result.recordset.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create
router.post('/', async (req, res) => {
  const { Nickname, BankName, AccountNumber, AccountType, Balance, InterestRate, Notes } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('Nickname',      sql.NVarChar(100), Nickname)
      .input('BankName',      sql.NVarChar(100), BankName)
      .input('AccountNumber', sql.NVarChar(50),  AccountNumber || null)
      .input('AccountType',   sql.NVarChar(20),  AccountType)
      .input('Balance',       sql.Decimal(18,2), Balance || 0)
      .input('InterestRate',  sql.Decimal(5,2),  InterestRate || null)
      .input('Notes',         sql.NVarChar(500), Notes || null)
      .query(`
        INSERT INTO dbo.BankAccounts (Nickname, BankName, AccountNumber, AccountType, Balance, InterestRate, Notes)
        OUTPUT INSERTED.*
        VALUES (@Nickname, @BankName, @AccountNumber, @AccountType, @Balance, @InterestRate, @Notes)
      `);
    res.status(201).json(result.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update
router.put('/:id', async (req, res) => {
  const { Nickname, BankName, AccountNumber, AccountType, Balance, InterestRate, Notes, IsActive } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id',            sql.Int,           req.params.id)
      .input('Nickname',      sql.NVarChar(100), Nickname)
      .input('BankName',      sql.NVarChar(100), BankName)
      .input('AccountNumber', sql.NVarChar(50),  AccountNumber || null)
      .input('AccountType',   sql.NVarChar(20),  AccountType)
      .input('Balance',       sql.Decimal(18,2), Balance)
      .input('InterestRate',  sql.Decimal(5,2),  InterestRate || null)
      .input('Notes',         sql.NVarChar(500), Notes || null)
      .input('IsActive',      sql.Bit,           IsActive !== undefined ? IsActive : 1)
      .query(`
        UPDATE dbo.BankAccounts
        SET Nickname=@Nickname, BankName=@BankName, AccountNumber=@AccountNumber,
            AccountType=@AccountType, Balance=@Balance, InterestRate=@InterestRate,
            Notes=@Notes, IsActive=@IsActive, LastUpdated=GETDATE()
        OUTPUT INSERTED.*
        WHERE AccountID=@id
      `);
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
      .query(`DELETE FROM dbo.BankAccounts WHERE AccountID=@id`);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
