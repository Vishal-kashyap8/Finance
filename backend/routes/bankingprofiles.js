const express = require('express');
const router  = express.Router();
const { getPool, sql } = require('../db');
const { enrichProfilesWithAccounts } = require('./relationshipUtils');

// Passphrase lives only in .env — never in source or DB
const ENC_KEY = process.env.DB_ENCRYPT_KEY || '';

// ── helpers ──────────────────────────────────────────────────────────────────
// SQL snippet that encrypts a named param and stores as hex string
const encCol = (param) =>
  `CONVERT(NVARCHAR(500), ENCRYPTBYPASSPHRASE(@encKey, ${param}), 1)`;

// SQL snippet that decrypts a hex-stored column back to NVARCHAR
const decCol = (col) =>
  `CONVERT(NVARCHAR(200), DECRYPTBYPASSPHRASE(@encKey, CONVERT(VARBINARY(500), ${col}, 1))) AS ${col}`;

// ── GET all ──────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const profileResult = await pool.request()
      .input('encKey', sql.NVarChar(500), ENC_KEY)
      .query(`
        SELECT
          ProfileID, BankName, Nickname, AccountType,
          IFSCCode, MICRCode, BranchName, BranchCity,
          RegisteredMobile, RegisteredEmail,
          DebitCardLast4, DebitCardExpiry,
          UPIIds, Notes,
          CreatedAt, LastUpdated,
          ${decCol('AccountNumber')},
          ${decCol('CustomerID')},
          ${decCol('NetBankingLoginID')},
          ${decCol('NetBankingPassword')}
        FROM dbo.BankingProfiles
        ORDER BY BankName, Nickname
      `);

    const accountResult = await pool.request()
      .query(`SELECT AccountID, Nickname, BankName, AccountNumber FROM dbo.BankAccounts ORDER BY BankName, Nickname`);

    res.json(enrichProfilesWithAccounts(profileResult.recordset, accountResult.recordset));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET single ───────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const profileResult = await pool.request()
      .input('id',     sql.Int,          req.params.id)
      .input('encKey', sql.NVarChar(500), ENC_KEY)
      .query(`
        SELECT
          ProfileID, BankName, Nickname, AccountType,
          IFSCCode, MICRCode, BranchName, BranchCity,
          RegisteredMobile, RegisteredEmail,
          DebitCardLast4, DebitCardExpiry,
          UPIIds, Notes,
          CreatedAt, LastUpdated,
          ${decCol('AccountNumber')},
          ${decCol('CustomerID')},
          ${decCol('NetBankingLoginID')},
          ${decCol('NetBankingPassword')}
        FROM dbo.BankingProfiles
        WHERE ProfileID = @id
      `);
    if (!profileResult.recordset.length) return res.status(404).json({ error: 'Not found' });

    const accountResult = await pool.request()
      .query(`SELECT AccountID, Nickname, BankName, AccountNumber FROM dbo.BankAccounts ORDER BY BankName, Nickname`);

    const enriched = enrichProfilesWithAccounts(profileResult.recordset, accountResult.recordset);
    res.json(enriched[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST create ──────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const {
    BankName, Nickname, AccountType,
    IFSCCode, MICRCode, BranchName, BranchCity,
    RegisteredMobile, RegisteredEmail,
    DebitCardLast4, DebitCardExpiry,
    UPIIds, Notes,
    AccountNumber, CustomerID, NetBankingLoginID, NetBankingPassword
  } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('encKey',              sql.NVarChar(500),  ENC_KEY)
      .input('BankName',            sql.NVarChar(100),  BankName)
      .input('Nickname',            sql.NVarChar(100),  Nickname)
      .input('AccountType',         sql.NVarChar(20),   AccountType   || 'Savings')
      .input('IFSCCode',            sql.NVarChar(20),   IFSCCode      || null)
      .input('MICRCode',            sql.NVarChar(20),   MICRCode      || null)
      .input('BranchName',          sql.NVarChar(200),  BranchName    || null)
      .input('BranchCity',          sql.NVarChar(100),  BranchCity    || null)
      .input('RegisteredMobile',    sql.NVarChar(50),   RegisteredMobile  || null)
      .input('RegisteredEmail',     sql.NVarChar(200),  RegisteredEmail   || null)
      .input('DebitCardLast4',      sql.NVarChar(10),   DebitCardLast4    || null)
      .input('DebitCardExpiry',     sql.NVarChar(10),   DebitCardExpiry   || null)
      .input('UPIIds',              sql.NVarChar(500),  UPIIds        || null)
      .input('Notes',               sql.NVarChar(1000), Notes         || null)
      .input('AccountNumber',       sql.NVarChar(200),  AccountNumber     || null)
      .input('CustomerID',          sql.NVarChar(200),  CustomerID        || null)
      .input('NetBankingLoginID',   sql.NVarChar(200),  NetBankingLoginID || null)
      .input('NetBankingPassword',  sql.NVarChar(200),  NetBankingPassword|| null)
      .query(`
        INSERT INTO dbo.BankingProfiles (
          BankName, Nickname, AccountType,
          IFSCCode, MICRCode, BranchName, BranchCity,
          RegisteredMobile, RegisteredEmail,
          DebitCardLast4, DebitCardExpiry,
          UPIIds, Notes,
          AccountNumber, CustomerID, NetBankingLoginID, NetBankingPassword
        )
        OUTPUT
          INSERTED.ProfileID, INSERTED.BankName, INSERTED.Nickname, INSERTED.AccountType,
          INSERTED.IFSCCode,  INSERTED.MICRCode,  INSERTED.BranchName, INSERTED.BranchCity,
          INSERTED.RegisteredMobile, INSERTED.RegisteredEmail,
          INSERTED.DebitCardLast4,   INSERTED.DebitCardExpiry,
          INSERTED.UPIIds, INSERTED.Notes,
          INSERTED.CreatedAt, INSERTED.LastUpdated
        VALUES (
          @BankName, @Nickname, @AccountType,
          @IFSCCode, @MICRCode, @BranchName, @BranchCity,
          @RegisteredMobile, @RegisteredEmail,
          @DebitCardLast4, @DebitCardExpiry,
          @UPIIds, @Notes,
          ${encCol('@AccountNumber')},
          ${encCol('@CustomerID')},
          ${encCol('@NetBankingLoginID')},
          ${encCol('@NetBankingPassword')}
        )
      `);
    res.status(201).json(result.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT update ───────────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const {
    BankName, Nickname, AccountType,
    IFSCCode, MICRCode, BranchName, BranchCity,
    RegisteredMobile, RegisteredEmail,
    DebitCardLast4, DebitCardExpiry,
    UPIIds, Notes,
    AccountNumber, CustomerID, NetBankingLoginID, NetBankingPassword
  } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id',                  sql.Int,            req.params.id)
      .input('encKey',              sql.NVarChar(500),  ENC_KEY)
      .input('BankName',            sql.NVarChar(100),  BankName)
      .input('Nickname',            sql.NVarChar(100),  Nickname)
      .input('AccountType',         sql.NVarChar(20),   AccountType   || 'Savings')
      .input('IFSCCode',            sql.NVarChar(20),   IFSCCode      || null)
      .input('MICRCode',            sql.NVarChar(20),   MICRCode      || null)
      .input('BranchName',          sql.NVarChar(200),  BranchName    || null)
      .input('BranchCity',          sql.NVarChar(100),  BranchCity    || null)
      .input('RegisteredMobile',    sql.NVarChar(50),   RegisteredMobile  || null)
      .input('RegisteredEmail',     sql.NVarChar(200),  RegisteredEmail   || null)
      .input('DebitCardLast4',      sql.NVarChar(10),   DebitCardLast4    || null)
      .input('DebitCardExpiry',     sql.NVarChar(10),   DebitCardExpiry   || null)
      .input('UPIIds',              sql.NVarChar(500),  UPIIds        || null)
      .input('Notes',               sql.NVarChar(1000), Notes         || null)
      .input('AccountNumber',       sql.NVarChar(200),  AccountNumber     || null)
      .input('CustomerID',          sql.NVarChar(200),  CustomerID        || null)
      .input('NetBankingLoginID',   sql.NVarChar(200),  NetBankingLoginID || null)
      .input('NetBankingPassword',  sql.NVarChar(200),  NetBankingPassword|| null)
      .query(`
        UPDATE dbo.BankingProfiles SET
          BankName            = @BankName,
          Nickname            = @Nickname,
          AccountType         = @AccountType,
          IFSCCode            = @IFSCCode,
          MICRCode            = @MICRCode,
          BranchName          = @BranchName,
          BranchCity          = @BranchCity,
          RegisteredMobile    = @RegisteredMobile,
          RegisteredEmail     = @RegisteredEmail,
          DebitCardLast4      = @DebitCardLast4,
          DebitCardExpiry     = @DebitCardExpiry,
          UPIIds              = @UPIIds,
          Notes               = @Notes,
          AccountNumber       = ${encCol('@AccountNumber')},
          CustomerID          = ${encCol('@CustomerID')},
          NetBankingLoginID   = ${encCol('@NetBankingLoginID')},
          NetBankingPassword  = ${encCol('@NetBankingPassword')},
          LastUpdated         = GETDATE()
        OUTPUT
          INSERTED.ProfileID, INSERTED.BankName, INSERTED.Nickname, INSERTED.AccountType,
          INSERTED.IFSCCode,  INSERTED.MICRCode,  INSERTED.BranchName, INSERTED.BranchCity,
          INSERTED.RegisteredMobile, INSERTED.RegisteredEmail,
          INSERTED.DebitCardLast4,   INSERTED.DebitCardExpiry,
          INSERTED.UPIIds, INSERTED.Notes,
          INSERTED.CreatedAt, INSERTED.LastUpdated
        WHERE ProfileID = @id
      `);
    if (!result.recordset.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE ───────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`DELETE FROM dbo.BankingProfiles WHERE ProfileID = @id`);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
