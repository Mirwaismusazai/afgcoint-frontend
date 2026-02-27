import type { NextApiRequest, NextApiResponse } from 'next';

import type { Block } from 'types/api/block';

import { blockFromRpc } from 'lib/web3/blockFromRpc';
import { publicClient } from 'lib/web3/client';

function getHeightOrHash(query: NextApiRequest['query']): string | null {
  const v = query.height_or_hash;
  if (typeof v === 'string' && v) return v;
  if (Array.isArray(v) && v[0]) return v[0];
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Block | { error: string }>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const heightOrHash = getHeightOrHash(req.query);
  if (!heightOrHash) {
    res.status(400).json({ error: 'Missing height_or_hash' });
    return;
  }

  if (!publicClient) {
    res.status(503).json({ error: 'RPC client not configured' });
    return;
  }

  try {
    const blockParams = heightOrHash.startsWith('0x')
      ? { blockHash: heightOrHash as `0x${ string }` }
      : { blockNumber: BigInt(heightOrHash) };
    const block = await publicClient.getBlock(blockParams);

    if (!block) {
      res.status(404).json({ error: 'Block not found' });
      return;
    }

    res.status(200).json(blockFromRpc(block));
  } catch (err) {
    res.status(404).json({ error: 'Block not found' });
  }
}
