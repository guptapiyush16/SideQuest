const path = require('path');
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');
const aiHandler = require('./api/ai.js');
require('dotenv').config({ path: path.join(__dirname, 'atlas-credentials.env') });

const app = express();
const port = Number(process.env.PORT || 3000);
const jwtSecret = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');
const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'sidequest';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
let db;
let photos;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname, { extensions: ['html'] }));
app.post('/api/ai', aiHandler);

function tokenFor(user) {
  return jwt.sign({ sub: user._id.toString(), email: user.email }, jwtSecret, { expiresIn: '30d' });
}

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const claims = jwt.verify(token, jwtSecret);
    const user = await db.collection('users').findOne({ _id: new ObjectId(claims.sub) });
    if (!user) return res.status(401).json({ error: 'Account not found' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Authentication required' });
  }
}

function cleanEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

async function createUser(email, password, name = 'Explorer') {
  if (!email.includes('@') || password.length < 8) throw new Error('Use a valid email and an 8+ character password');
  const existing = await db.collection('users').findOne({ email });
  if (existing) throw new Error('An account with this email already exists');
  const user = {
    email,
    passwordHash: await bcrypt.hash(password, 12),
    name: name.trim().slice(0, 80) || 'Explorer',
    xp: 0,
    level: 1,
    interests: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const result = await db.collection('users').insertOne(user);
  user._id = result.insertedId;
  return user;
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const user = await createUser(cleanEmail(req.body.email), String(req.body.password || ''), String(req.body.name || 'Explorer'));
    res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = cleanEmail(req.body.email);
    const user = await db.collection('users').findOne({ email });
    if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.json({ token: tokenFor(user), user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));

app.get('/api/state', auth, async (req, res) => {
  const [rawDiscoveries, adventures] = await Promise.all([
    db.collection('discoveries').find({ userId: req.user._id }).toArray(),
    db.collection('adventures').find({ userId: req.user._id }).toArray()
  ]);
  const discoveries = rawDiscoveries.map((entry) => ({
    ...entry,
    species_id: entry.id,
    scientific_name: entry.scientific,
    location_name: entry.place,
    photo_data: entry.photoFileId ? `/api/photos/${entry.photoFileId}` : null,
    first_seen: entry.firstSeen,
    last_seen: entry.lastSeen
  }));
  res.json({ profile: publicUser(req.user), dexEntries: discoveries, adventures });
});

app.put('/api/profile', auth, async (req, res) => {
  const patch = {
    name: String(req.body.name || 'Explorer').slice(0, 80),
    xp: Math.max(0, Number(req.body.xp) || 0),
    level: Math.max(1, Number(req.body.level) || 1),
    interests: Array.isArray(req.body.interests) ? req.body.interests.slice(0, 20).map(String) : [],
    updatedAt: new Date()
  };
  await db.collection('users').updateOne({ _id: req.user._id }, { $set: patch });
  res.json({ user: publicUser({ ...req.user, ...patch }) });
});

app.post('/api/discoveries', auth, async (req, res) => {
  const entry = { ...req.body, userId: req.user._id, updatedAt: new Date() };
  delete entry._id;
  if (entry.photoData?.startsWith('data:')) {
    const match = entry.photoData.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: 'Invalid photo' });
    const stream = photos.openUploadStream(`${req.user._id}/${entry.id || crypto.randomUUID()}.jpg`, {
      metadata: { userId: req.user._id.toString(), contentType: match[1] }
    });
    await new Promise((resolve, reject) => {
      stream.once('finish', resolve);
      stream.once('error', reject);
      stream.end(Buffer.from(match[2], 'base64'));
    });
    entry.photoFileId = stream.id;
    delete entry.photoData;
  }
  await db.collection('discoveries').updateOne(
    { userId: req.user._id, id: entry.id },
    { $set: entry },
    { upsert: true }
  );
  res.status(201).json({ ok: true });
});

app.get('/api/photos/:id', auth, async (req, res) => {
  const file = await db.collection('fs.files').findOne({ _id: new ObjectId(req.params.id), 'metadata.userId': req.user._id.toString() });
  if (!file) return res.sendStatus(404);
  res.setHeader('Content-Type', file.metadata.contentType || 'image/jpeg');
  photos.openDownloadStream(file._id).pipe(res);
});

app.post('/api/adventures', auth, async (req, res) => {
  await db.collection('adventures').updateOne(
    { userId: req.user._id, date_key: req.body.dateKey },
    { $set: { ...req.body, userId: req.user._id, updatedAt: new Date() } },
    { upsert: true }
  );
  res.json({ ok: true });
});

app.get('/api/health', async (_req, res) => {
  await db.command({ ping: 1 });
  res.json({ ok: true });
});

function publicUser(user) {
  return { id: user._id.toString(), email: user.email, name: user.name, xp: user.xp, level: user.level, interests: user.interests };
}

async function start() {
  if (!mongoUri) throw new Error('MONGODB_URI is not configured');
  const client = await MongoClient.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000
  });
  db = client.db(dbName);
  photos = new GridFSBucket(db, { bucketName: 'photos' });
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  app.listen(port, '0.0.0.0', () => console.log(`SideQuest server listening on port ${port}`));
}

start().catch(error => {
  console.error('SideQuest startup failed:', error.message);
  if (error.message.includes('MONGODB_URI')) {
    console.error('Set MONGODB_URI in Render Environment Variables.');
  } else if (error.name === 'MongoServerSelectionError' || error.name === 'MongoNetworkError') {
    console.error('Allow Render to connect in MongoDB Atlas Network Access and verify the Atlas database user.');
  }
  process.exit(1);
});
