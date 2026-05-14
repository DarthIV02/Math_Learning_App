const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors({
  origin: [
    'https://172.24.220.6:3000',
    'https://131.159.198.187:3000',
    'https://192.168.1.103:3000',
    'https://localhost:3000',
    'https://127.0.0.1:3000',
  ],
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
app.use('/api', require('./routes/lookups'));

const PORT = process.env.PORT || 3001;

https.createServer({
  key: fs.readFileSync('./certs/key.pem'),
  cert: fs.readFileSync('./certs/cert.pem'),
}, app).listen(PORT, () => {
  console.log(`HTTPS API running on port ${PORT}`);
});