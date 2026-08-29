const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db');

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`SELECT * FROM dbo.TransactionCategories ORDER BY Type, Name`);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { Type, Name, Icon } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('Type', sql.NVarChar(10),  Type)
      .input('Name', sql.NVarChar(100), Name)
      .input('Icon', sql.NVarChar(10),  Icon || null)
      .query(`
        INSERT INTO dbo.TransactionCategories (Type, Name, Icon)
        OUTPUT INSERTED.*
        VALUES (@Type, @Name, @Icon)
      `);
    res.status(201).json(result.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`DELETE FROM dbo.TransactionCategories WHERE CategoryID=@id`);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
