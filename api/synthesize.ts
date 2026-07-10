import { synthesizeStudyGuide } from '../src/server/syntexEngine';

export const config = {
  maxDuration: 60,
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const content = typeof req.body === 'string' ? JSON.parse(req.body)?.content : req.body?.content;
    const referer = req.headers?.origin || req.headers?.referer;
    const result = await synthesizeStudyGuide(content, referer);
    return res.status(200).json({ result });
  } catch (error) {
    console.error('Vercel synthesize error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Error interno del servidor' });
  }
}
