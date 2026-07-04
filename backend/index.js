const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/problems', require('./routes/problems'));
app.use('/api/attempts', require('./routes/attempts'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/assessment', require('./routes/assessment'));
app.use('/api/mastery', require('./routes/mastery'));
app.use('/api', require('./routes/lookups'));

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});

app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);
  res.status(500).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});