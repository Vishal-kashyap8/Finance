const express = require('express');
const router  = express.Router();
const { getPool, sql } = require('../db');

// GET all income tax records
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request()
      .query(`SELECT * FROM dbo.IncomeTax ORDER BY FinancialYear DESC`);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET single
router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT * FROM dbo.IncomeTax WHERE TaxID=@id`);
    if (!r.recordset.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.recordset[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create
router.post('/', async (req, res) => {
  try {
    const {
      AssessmentYear, FinancialYear, GrossIncome, TaxableIncome,
      TaxPaid, TDSDeducted, AdvanceTax, SelfAssessTax, Refund,
      InterestAndFee, TaxRegime, FilingStatus, FilingDate, AcknowledgmentNo, Notes
    } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('AssessmentYear',  sql.NVarChar(10),  AssessmentYear)
      .input('FinancialYear',   sql.NVarChar(10),  FinancialYear)
      .input('GrossIncome',     sql.Decimal(18,2), GrossIncome     || 0)
      .input('TaxableIncome',   sql.Decimal(18,2), TaxableIncome   || 0)
      .input('TaxPaid',         sql.Decimal(18,2), TaxPaid         || 0)
      .input('TDSDeducted',     sql.Decimal(18,2), TDSDeducted     || 0)
      .input('AdvanceTax',      sql.Decimal(18,2), AdvanceTax      || 0)
      .input('SelfAssessTax',   sql.Decimal(18,2), SelfAssessTax   || 0)
      .input('Refund',          sql.Decimal(18,2), Refund          || 0)
      .input('InterestAndFee',  sql.Decimal(18,2), InterestAndFee  || 0)
      .input('TaxRegime',       sql.NVarChar(20),  TaxRegime       || 'New')
      .input('FilingStatus',    sql.NVarChar(20),  FilingStatus    || 'Filed')
      .input('FilingDate',      sql.Date,          FilingDate      || null)
      .input('AcknowledgmentNo',sql.NVarChar(50),  AcknowledgmentNo|| null)
      .input('Notes',           sql.NVarChar(500), Notes           || null)
      .query(`INSERT INTO dbo.IncomeTax
              (AssessmentYear,FinancialYear,GrossIncome,TaxableIncome,
               TaxPaid,TDSDeducted,AdvanceTax,SelfAssessTax,Refund,
               InterestAndFee,TaxRegime,FilingStatus,FilingDate,AcknowledgmentNo,Notes)
              VALUES
              (@AssessmentYear,@FinancialYear,@GrossIncome,@TaxableIncome,
               @TaxPaid,@TDSDeducted,@AdvanceTax,@SelfAssessTax,@Refund,
               @InterestAndFee,@TaxRegime,@FilingStatus,@FilingDate,@AcknowledgmentNo,@Notes)`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const {
      AssessmentYear, FinancialYear, GrossIncome, TaxableIncome,
      TaxPaid, TDSDeducted, AdvanceTax, SelfAssessTax, Refund,
      InterestAndFee, TaxRegime, FilingStatus, FilingDate, AcknowledgmentNo, Notes
    } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id',              sql.Int,           req.params.id)
      .input('AssessmentYear',  sql.NVarChar(10),  AssessmentYear)
      .input('FinancialYear',   sql.NVarChar(10),  FinancialYear)
      .input('GrossIncome',     sql.Decimal(18,2), GrossIncome     || 0)
      .input('TaxableIncome',   sql.Decimal(18,2), TaxableIncome   || 0)
      .input('TaxPaid',         sql.Decimal(18,2), TaxPaid         || 0)
      .input('TDSDeducted',     sql.Decimal(18,2), TDSDeducted     || 0)
      .input('AdvanceTax',      sql.Decimal(18,2), AdvanceTax      || 0)
      .input('SelfAssessTax',   sql.Decimal(18,2), SelfAssessTax   || 0)
      .input('Refund',          sql.Decimal(18,2), Refund          || 0)
      .input('InterestAndFee',  sql.Decimal(18,2), InterestAndFee  || 0)
      .input('TaxRegime',       sql.NVarChar(20),  TaxRegime       || 'New')
      .input('FilingStatus',    sql.NVarChar(20),  FilingStatus    || 'Filed')
      .input('FilingDate',      sql.Date,          FilingDate      || null)
      .input('AcknowledgmentNo',sql.NVarChar(50),  AcknowledgmentNo|| null)
      .input('Notes',           sql.NVarChar(500), Notes           || null)
      .query(`UPDATE dbo.IncomeTax SET
              AssessmentYear=@AssessmentYear, FinancialYear=@FinancialYear,
              GrossIncome=@GrossIncome, TaxableIncome=@TaxableIncome,
              TaxPaid=@TaxPaid, TDSDeducted=@TDSDeducted,
              AdvanceTax=@AdvanceTax, SelfAssessTax=@SelfAssessTax,
              Refund=@Refund, InterestAndFee=@InterestAndFee,
              TaxRegime=@TaxRegime, FilingStatus=@FilingStatus,
              FilingDate=@FilingDate, AcknowledgmentNo=@AcknowledgmentNo,
              Notes=@Notes, UpdatedAt=GETDATE()
              WHERE TaxID=@id`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`DELETE FROM dbo.IncomeTax WHERE TaxID=@id`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
