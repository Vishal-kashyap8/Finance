const express = require('express');
const router  = express.Router();
const { getPool, sql } = require('../db');

// GET all EPFO accounts
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query(`SELECT * FROM dbo.EPFOAccounts ORDER BY MemberName`);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET single
router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT * FROM dbo.EPFOAccounts WHERE EPFOID=@id`);
    if (!r.recordset.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.recordset[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create
router.post('/', async (req, res) => {
  try {
    const { MemberName, UAN, EmployerName, Balance, Notes } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('MemberName',   sql.NVarChar(100), MemberName)
      .input('UAN',          sql.NVarChar(20),  UAN || null)
      .input('EmployerName', sql.NVarChar(200), EmployerName || null)
      .input('Balance',      sql.Decimal(18,2), Balance || 0)
      .input('Notes',        sql.NVarChar(500), Notes || null)
      .query(`INSERT INTO dbo.EPFOAccounts (MemberName,UAN,EmployerName,Balance,Notes)
              VALUES (@MemberName,@UAN,@EmployerName,@Balance,@Notes)`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const { MemberName, UAN, EmployerName, Balance, Notes } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id',           sql.Int,           req.params.id)
      .input('MemberName',   sql.NVarChar(100), MemberName)
      .input('UAN',          sql.NVarChar(20),  UAN || null)
      .input('EmployerName', sql.NVarChar(200), EmployerName || null)
      .input('Balance',      sql.Decimal(18,2), Balance || 0)
      .input('Notes',        sql.NVarChar(500), Notes || null)
      .query(`UPDATE dbo.EPFOAccounts
              SET MemberName=@MemberName, UAN=@UAN, EmployerName=@EmployerName,
                  Balance=@Balance, Notes=@Notes, LastUpdated=GETDATE()
              WHERE EPFOID=@id`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`DELETE FROM dbo.EPFOAccounts WHERE EPFOID=@id`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
