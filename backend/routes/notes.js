const express = require('express');
const router  = express.Router();
const { getPool, sql } = require('../db');

// GET all
router.get('/', async (req, res) => {
  try {
    const pool   = await getPool();
    const result = await pool.request().query(`
      SELECT * FROM dbo.Notes
      ORDER BY
        CASE Status WHEN 'Pending' THEN 0 WHEN 'Snoozed' THEN 1 ELSE 2 END,
        CASE Priority WHEN 'High' THEN 0 WHEN 'Medium' THEN 1 ELSE 2 END,
        DueDate ASC, CreatedAt DESC`);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single
router.get('/:id', async (req, res) => {
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT * FROM dbo.Notes WHERE NoteID=@id`);
    if (!result.recordset.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST
router.post('/', async (req, res) => {
  const { Title, NoteType, Priority, Status, Amount, DueDate, Tags, Body } = req.body;
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('Title',    sql.NVarChar(200),  Title)
      .input('NoteType', sql.NVarChar(20),   NoteType  || 'Note')
      .input('Priority', sql.NVarChar(10),   Priority  || 'Medium')
      .input('Status',   sql.NVarChar(20),   Status    || 'Pending')
      .input('Amount',   sql.Decimal(18,2),  Amount    || null)
      .input('DueDate',  sql.Date,           DueDate   || null)
      .input('Tags',     sql.NVarChar(300),  Tags      || null)
      .input('Body',     sql.NVarChar(2000), Body      || null)
      .query(`INSERT INTO dbo.Notes (Title,NoteType,Priority,Status,Amount,DueDate,Tags,Body)
              OUTPUT INSERTED.*
              VALUES (@Title,@NoteType,@Priority,@Status,@Amount,@DueDate,@Tags,@Body)`);
    res.status(201).json(result.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT
router.put('/:id', async (req, res) => {
  const { Title, NoteType, Priority, Status, Amount, DueDate, Tags, Body } = req.body;
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('id',       sql.Int,            req.params.id)
      .input('Title',    sql.NVarChar(200),  Title)
      .input('NoteType', sql.NVarChar(20),   NoteType)
      .input('Priority', sql.NVarChar(10),   Priority)
      .input('Status',   sql.NVarChar(20),   Status)
      .input('Amount',   sql.Decimal(18,2),  Amount   || null)
      .input('DueDate',  sql.Date,           DueDate  || null)
      .input('Tags',     sql.NVarChar(300),  Tags     || null)
      .input('Body',     sql.NVarChar(2000), Body     || null)
      .query(`UPDATE dbo.Notes
              SET Title=@Title, NoteType=@NoteType, Priority=@Priority, Status=@Status,
                  Amount=@Amount, DueDate=@DueDate, Tags=@Tags, Body=@Body,
                  LastUpdated=GETDATE()
              OUTPUT INSERTED.*
              WHERE NoteID=@id`);
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
      .query(`DELETE FROM dbo.Notes WHERE NoteID=@id`);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
