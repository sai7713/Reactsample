require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sql = require('mssql');

const app = express();
app.use(bodyParser.json());

const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-this';
const port = process.env.PORT || 8080;

const sqlConfig = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DB,
  options: { encrypt: true },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

let poolPromise = null;
async function getPool() {
  if (!poolPromise) poolPromise = sql.connect(sqlConfig);
  return poolPromise;
}

async function recordLogin({ username, userId = null, success, ip, ua }) {
  try {
    const pool = await getPool();
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('username', sql.NVarChar(100), username)
      .input('success', sql.Bit, success ? 1 : 0)
      .input('ip', sql.NVarChar(100), ip)
      .input('ua', sql.NVarChar(500), ua)
      .query(`INSERT INTO dbo.LoginHistory (UserId, Username, Success, IpAddress, UserAgent)
              VALUES (@userId, @username, @success, @ip, @ua)`);
  } catch (e) { console.error('audit error', e.message); }
}

app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing' });
  const hash = await bcrypt.hash(password, 12);
  try {
    const pool = await getPool();
    await pool.request()
      .input('u', sql.NVarChar(100), username)
      .input('h', sql.NVarChar(200), hash)
      .query('INSERT INTO dbo.Users (Username, PasswordHash, IsAdmin) VALUES (@u,@h,0)');
    res.json({ ok: true });
  } catch (err) {
    if (err && err.number === 2627) return res.status(409).json({ error: 'User exists' });
    console.error(err);
    res.status(500).json({ error: 'db' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || '';
  const ua = req.headers['user-agent'] || '';
  try {
    const pool = await getPool();
    const result = await pool.request().input('u', sql.NVarChar(100), username)
      .query('SELECT Id, PasswordHash, IsAdmin FROM dbo.Users WHERE Username=@u');
    const user = result.recordset[0];
    if (!user) {
      await recordLogin({ username, success: false, ip, ua });
      return res.status(401).json({ error: 'Invalid' });
    }
    const ok = await bcrypt.compare(password, user.PasswordHash);
    await recordLogin({ username, userId: user.Id, success: ok, ip, ua });
    if (!ok) return res.status(401).json({ error: 'Invalid' });
    const token = jwt.sign({ sub: user.Id, username, isAdmin: !!user.IsAdmin }, jwtSecret, { expiresIn: '8h' });
    res.json({ token });
  } catch (e) { console.error(e); res.status(500).json({ error: 'server' }); }
});

function auth(requiredAdmin = false) {
  return (req, res, next) => {
    const h = req.headers.authorization;
    if (!h) return res.status(401).end();
    const token = h.split(' ')[1];
    try {
      const payload = jwt.verify(token, jwtSecret);
      if (requiredAdmin && !payload.isAdmin) return res.status(403).end();
      req.user = payload;
      next();
    } catch (e) { return res.status(401).end(); }
  };
}

app.get('/api/customer/:id', auth(false), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).end();
  try {
    const pool = await getPool();
    const r = await pool.request().input('id', sql.Int, id)
      .query('SELECT Name, DOB, Phone, Address FROM dbo.Customers WHERE Id=@id');
    res.json(r.recordset[0] || null);
  } catch (e) { console.error(e); res.status(500).end(); }
});

app.get('/api/admin/users', auth(true), async (req, res) => {
  const pool = await getPool();
  const r = await pool.request().query('SELECT Id, Username, IsAdmin, CreatedAt FROM dbo.Users');
  res.json(r.recordset);
});

app.get('/api/admin/logs', auth(true), async (req, res) => {
  const pool = await getPool();
  const r = await pool.request().query('SELECT TOP 100 * FROM dbo.LoginHistory ORDER BY CreatedAt DESC');
  res.json(r.recordset);
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

const path = require('path');
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => console.log(`Server listening on ${port}`));
