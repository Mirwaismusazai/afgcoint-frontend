import type { NextApiRequest, NextApiResponse } from 'next';

import type { Block } from 'types/api/block';

import { blockFromRpc } from 'lib/web3/blockFromRpc';
import { publicClient } from 'lib/web3/client';

const HOME_PAGE_BLOCKS_COUNT = 5;

export default async function handler(req: NextApiRequest, res: NextApiResponse<Array<Block> | { error: string }>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!publicClient) {
    res.status(503).json({ error: 'RPC client not configured' });
    return;
  }

  try {
    const latest = await publicClient.getBlockNumber();
    const count = Math.min(Number(latest), HOME_PAGE_BLOCKS_COUNT);
    const blocks: Array<Block> = [];

    for (let i = 0; i < count; i++) {
      const blockNum = latest - BigInt(i);
      const block = await publicClient.getBlock({ blockNumber: blockNum });
      if (block) blocks.push(blockFromRpc(block));
    }

    res.status(200).json(blocks);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch blocks' });
  }
}
