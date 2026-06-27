import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import centerRoutes from './routes/centers.js';
import requestRoutes from './routes/requests.js';
import dashboardRoutes from './routes/dashboard.js';
import logRoutes from './routes/logs.js';
import { authRequired, requireRole } from './middleware/auth.js';
import seedDemoData from './db/seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'Asap-Agap API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/centers', centerRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/logs', logRoutes);

app.post('/api/admin/reset-demo', authRequired, requireRole('ldrrmo'), async (_req, res) => {
  try {
    await seedDemoData();
    res.json({ ok: true, message: 'Demo data reset to defaults.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Reset failed.' });
  }
});

const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(config.port, () => {
  console.log(`Asap-Agap API running on http://localhost:${config.port}`);
});
