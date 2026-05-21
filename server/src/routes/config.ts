import { Router } from 'express';
import { emitRealtime } from '../realtime';
import { getAutopagoConfig, updateAutopagoConfig } from '../autopago';

const router = Router();

router.get('/autopago', async (_req, res) => {
  try {
    res.json(await getAutopagoConfig());
  } catch {
    res.status(500).json({ error: 'Error' });
  }
});

router.put('/autopago', async (req, res) => {
  try {
    const minutos = Number(req.body?.minutos);
    const activo = Boolean(req.body?.activo);
    if (Number.isNaN(minutos) || minutos < 0) {
      return res.status(400).json({ error: 'Minutos inválidos' });
    }
    const updated = await updateAutopagoConfig({ activo, minutos });
    emitRealtime({
      type: 'sync',
      entity: 'config',
      action: 'update',
      id: 'autopago',
      timestamp: new Date().toISOString(),
      payload: updated,
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Error' });
  }
});

export default router;
