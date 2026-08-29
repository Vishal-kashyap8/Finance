const express = require('express');
const router  = express.Router();
const { getPool, sql } = require('../db');

// GET all
router.get('/', async (req, res) => {
  try {
    const pool   = await getPool();
    const result = await pool.request().query(`
      SELECT l.*, ba.Nickname AS LinkedAccountName
      FROM dbo.Loans l
      LEFT JOIN dbo.BankAccounts ba ON l.LinkedAccountID = ba.AccountID
      ORDER BY l.Status, l.DueDate, l.LoanDate DESC`);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single
router.get('/:id', async (req, res) => {
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT * FROM dbo.Loans WHERE LoanID=@id`);
    if (!result.recordset.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST
router.post('/', async (req, res) => {
  const { LoanType, PersonName, Description, PrincipalAmount, OutstandingAmount,
          InterestRate, LoanDate, DueDate, Status, LinkedAccountID, Notes } = req.body;
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('LoanType',          sql.NVarChar(10),  LoanType)
      .input('PersonName',        sql.NVarChar(150), PersonName)
      .input('Description',       sql.NVarChar(500), Description       || null)
      .input('PrincipalAmount',   sql.Decimal(18,2), PrincipalAmount)
      .input('OutstandingAmount', sql.Decimal(18,2), OutstandingAmount || PrincipalAmount)
      .input('InterestRate',      sql.Decimal(5,2),  InterestRate      || null)
      .input('LoanDate',          sql.Date,          LoanDate          || new Date())
      .input('DueDate',           sql.Date,          DueDate           || null)
      .input('Status',            sql.NVarChar(10),  Status            || 'Active')
      .input('LinkedAccountID',   sql.Int,           LinkedAccountID   || null)
      .input('Notes',             sql.NVarChar(500), Notes             || null)
      .query(`INSERT INTO dbo.Loans
                (LoanType,PersonName,Description,PrincipalAmount,OutstandingAmount,
                 InterestRate,LoanDate,DueDate,Status,LinkedAccountID,Notes)
              OUTPUT INSERTED.*
              VALUES (@LoanType,@PersonName,@Description,@PrincipalAmount,@OutstandingAmount,
                      @InterestRate,@LoanDate,@DueDate,@Status,@LinkedAccountID,@Notes)`);
    res.status(201).json(result.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT
router.put('/:id', async (req, res) => {
  const { LoanType, PersonName, Description, PrincipalAmount, OutstandingAmount,
          InterestRate, LoanDate, DueDate, Status, LinkedAccountID, Notes } = req.body;
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('id',                sql.Int,           req.params.id)
      .input('LoanType',          sql.NVarChar(10),  LoanType)
      .input('PersonName',        sql.NVarChar(150), PersonName)
      .input('Description',       sql.NVarChar(500), Description       || null)
      .input('PrincipalAmount',   sql.Decimal(18,2), PrincipalAmount)
      .input('OutstandingAmount', sql.Decimal(18,2), OutstandingAmount)
      .input('InterestRate',      sql.Decimal(5,2),  InterestRate      || null)
      .input('LoanDate',          sql.Date,          LoanDate)
      .input('DueDate',           sql.Date,          DueDate           || null)
      .input('Status',            sql.NVarChar(10),  Status)
      .input('LinkedAccountID',   sql.Int,           LinkedAccountID   || null)
      .input('Notes',             sql.NVarChar(500), Notes             || null)
      .query(`UPDATE dbo.Loans
              SET LoanType=@LoanType, PersonName=@PersonName, Description=@Description,
                  PrincipalAmount=@PrincipalAmount, OutstandingAmount=@OutstandingAmount,
                  InterestRate=@InterestRate, LoanDate=@LoanDate, DueDate=@DueDate,
                  Status=@Status, LinkedAccountID=@LinkedAccountID,
                  Notes=@Notes, LastUpdated=GETDATE()
              OUTPUT INSERTED.*
              WHERE LoanID=@id`);
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
      .query(`DELETE FROM dbo.Loans WHERE LoanID=@id`);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
