const express = require('express');
const router  = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Read from .env on every request so a server restart always picks up the latest values
  const validUser = process.env.APP_USER     || 'admin';
  const validPass = process.env.APP_PASSWORD || 'finance123';
  if (username === validUser && password === validPass) {
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
