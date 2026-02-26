import type { NextApiRequest, NextApiResponse } from 'next';

import type { SearchRedirectResult } from 'types/api/search';

import { parseSearchQuery } from './parseSearchQuery';

export default function handler(req: NextApiRequest, res: NextApiResponse<SearchRedirectResult>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ redirect: false, type: null, parameter: null });
    return;
  }

  const q = typeof req.query.q === 'string' ? req.query.q : (req.query.q?.[0] ?? '');
  const { type, parameter } = parseSearchQuery(q);

  const result: SearchRedirectResult = {
    redirect: type !== null && parameter.length > 0,
    type,
    parameter: type !== null ? parameter : null,
  };

  res.status(200).json(result);
}
