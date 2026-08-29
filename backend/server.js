require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Auth route (public — no protection needed)
app.use('/api/auth', require('./routes/auth'));

// API Routes (all protected — client must have logged in via /api/auth/login)
app.use('/api/dashboard',    require('./routes/dashboard'));
app.use('/api/accounts',     require('./routes/accounts'));
app.use('/api/cash',         require('./routes/cash'));
app.use('/api/fd',           require('./routes/fd'));
app.use('/api/rd',           require('./routes/rd'));
app.use('/api/investments',  require('./routes/investments'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/categories',   require('./routes/categories'));
app.use('/api/creditcards',  require('./routes/creditcards'));
app.use('/api/loans',        require('./routes/loans'));
app.use('/api/epfo',         require('./routes/epfo'));
app.use('/api/incometax',    require('./routes/incometax'));
app.use('/api/notes',        require('./routes/notes'));

// Fallback: always serve login page for unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Finance Tracker running on http://localhost:${PORT}`);
});
