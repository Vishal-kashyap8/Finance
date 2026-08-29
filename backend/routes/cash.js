const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db');

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`SELECT * FROM dbo.CashHoldings ORDER BY Category`);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT * FROM dbo.CashHoldings WHERE CashID=@id`);
    if (!result.recordset.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { Category, Amount, Notes } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('Category', sql.NVarChar(50),  Category)
      .input('Amount',   sql.Decimal(18,2), Amount || 0)
      .input('Notes',    sql.NVarChar(500), Notes || null)
      .query(`
        INSERT INTO dbo.CashHoldings (Category, Amount, Notes)
        OUTPUT INSERTED.*
        VALUES (@Category, @Amount, @Notes)
      `);
    res.status(201).json(result.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  const { Category, Amount, Notes } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id',       sql.Int,           req.params.id)
      .input('Category', sql.NVarChar(50),  Category)
      .input('Amount',   sql.Decimal(18,2), Amount)
      .input('Notes',    sql.NVarChar(500), Notes || null)
      .query(`
        UPDATE dbo.CashHoldings
        SET Category=@Category, Amount=@Amount, Notes=@Notes, LastUpdated=GETDATE()
        OUTPUT INSERTED.*
        WHERE CashID=@id
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
      .query(`DELETE FROM dbo.CashHoldings WHERE CashID=@id`);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
