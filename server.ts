import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const distPath = path.resolve(__dirname, 'dist');

// Serve static assets from dist
app.use(express.static(distPath));

// Also support aliases so any asset request (/assets/*, /dist/assets/*, /index.css, /app.js) never 404s
app.use('/dist', express.static(distPath));
app.use('/assets', express.static(path.join(distPath, 'assets')));

// Direct aliases for index.css and app.js
app.get('/index.css', (_req, res) => {
  res.sendFile(path.join(distPath, 'assets', 'index.css'));
});
app.get('/app.js', (_req, res) => {
  res.sendFile(path.join(distPath, 'assets', 'app.js'));
});
app.get('/dist/assets/index.css', (_req, res) => {
  res.sendFile(path.join(distPath, 'assets', 'index.css'));
});
app.get('/dist/assets/app.js', (_req, res) => {
  res.sendFile(path.join(distPath, 'assets', 'app.js'));
});

// Fallback all SPA navigation routes to dist/index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Nirnay Sutra static server listening on http://0.0.0.0:${PORT}`);
});
