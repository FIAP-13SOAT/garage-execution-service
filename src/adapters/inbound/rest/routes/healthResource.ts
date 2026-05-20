import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'garage-execution-service' });
});

router.get('/version', (_req, res) => {
  res.json({ version: '1.2.0', service: 'garage-execution-service' });
});

export default router;
