const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');

const app = express();
const PORT = 3000;
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/music'),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

app.use(express.static('public'));
app.use(bodyParser.json());

// Load and serve playlists
app.get('/api/playlists', (req, res) => {
  const data = fs.readFileSync('playlists.json', 'utf-8');
  res.json(JSON.parse(data));
});

// Save playlists
app.post('/api/playlists', (req, res) => {
  const playlists = req.body;
  fs.writeFileSync('playlists.json', JSON.stringify(playlists, null, 2));
  res.json({ status: 'success' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Upload endpoint
app.post('/upload', upload.single('musicFile'), (req, res) => {
  res.redirect('/');
});

app.get('/api/songs', (req, res) => {
  const musicDir = path.join(__dirname, 'public/music');
  fs.readdir(musicDir, (err, files) => {
    const mp3s = files.filter(f => f.endsWith('.mp3'));
    res.json(mp3s);
  });
});
