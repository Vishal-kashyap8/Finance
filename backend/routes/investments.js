const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db');

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`SELECT * FROM dbo.Investments ORDER BY Category, Name`);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT * FROM dbo.Investments WHERE InvestmentID=@id`);
    if (!result.recordset.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { Category, Name, InvestedAmount, CurrentValue, Units, StartDate, Notes } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('Category',       sql.NVarChar(50),  Category)
      .input('Name',           sql.NVarChar(200), Name)
      .input('InvestedAmount', sql.Decimal(18,2), InvestedAmount)
      .input('CurrentValue',   sql.Decimal(18,2), CurrentValue)
      .input('Units',          sql.Decimal(18,4), Units || null)
      .input('StartDate',      sql.Date,          StartDate || null)
      .input('Notes',          sql.NVarChar(500), Notes || null)
      .query(`
        INSERT INTO dbo.Investments (Category, Name, InvestedAmount, CurrentValue, Units, StartDate, Notes)
        OUTPUT INSERTED.*
        VALUES (@Category, @Name, @InvestedAmount, @CurrentValue, @Units, @StartDate, @Notes)
      `);
    res.status(201).json(result.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  const { Category, Name, InvestedAmount, CurrentValue, Units, StartDate, Notes } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id',             sql.Int,           req.params.id)
      .input('Category',       sql.NVarChar(50),  Category)
      .input('Name',           sql.NVarChar(200), Name)
      .input('InvestedAmount', sql.Decimal(18,2), InvestedAmount)
      .input('CurrentValue',   sql.Decimal(18,2), CurrentValue)
      .input('Units',          sql.Decimal(18,4), Units || null)
      .input('StartDate',      sql.Date,          StartDate || null)
      .input('Notes',          sql.NVarChar(500), Notes || null)
      .query(`
        UPDATE dbo.Investments
        SET Category=@Category, Name=@Name, InvestedAmount=@InvestedAmount,
            CurrentValue=@CurrentValue, Units=@Units, StartDate=@StartDate,
            Notes=@Notes, LastUpdated=GETDATE()
        OUTPUT INSERTED.*
        WHERE InvestmentID=@id
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
      .query(`DELETE FROM dbo.Investments WHERE InvestmentID=@id`);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
