import type { NextApiRequest, NextApiResponse } from 'next';

import type { BlocksResponse } from 'types/api/block';

import { blockFromRpc } from 'lib/web3/blockFromRpc';
import { publicClient } from 'lib/web3/client';

const DEFAULT_ITEMS_COUNT = 50;
const MAX_ITEMS_COUNT = 50;

function getQueryInt(query: NextApiRequest['query'], key: string, defaultValue: number): number {
  const v = query[key];
  if (v === undefined || v === null) return defaultValue;
  const parsed = typeof v === 'string' ? parseInt(v, 10) : Array.isArray(v) ? parseInt(v[0], 10) : NaN;
  return Number.isNaN(parsed) ? defaultValue : Math.min(Math.max(parsed, 1), MAX_ITEMS_COUNT);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<BlocksResponse | { error: string }>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!publicClient) {
    res.status(503).json({ error: 'RPC client not configured' });
    return;
  }

  const blockNumberParam = req.query.block_number;
  const startBlock = blockNumberParam !== undefined && blockNumberParam !== ''
    ? (typeof blockNumberParam === 'string' ? parseInt(blockNumberParam, 10) : parseInt(String(blockNumberParam[0]), 10))
    : null;
  const itemsCount = getQueryInt(req.query, 'items_count', DEFAULT_ITEMS_COUNT);

  try {
    const latest = await publicClient.getBlockNumber();
    const endBlock = startBlock !== null && !Number.isNaN(startBlock) && BigInt(startBlock) < latest
      ? BigInt(startBlock) - BigInt(1)
      : latest;

    const blocks: Array<ReturnType<typeof blockFromRpc>> = [];
    let current = endBlock;

    while (blocks.length < itemsCount && current >= BigInt(0)) {
      const block = await publicClient.getBlock({ blockNumber: current });
      if (block) blocks.push(blockFromRpc(block));
      current -= BigInt(1);
    }

    // Next page: client sends block_number = smallest block we returned (fetch blocks before it)
    const minBlockReturned = blocks.length > 0 ? blocks[blocks.length - 1]!.height : 0;
    const hasNextPage = minBlockReturned > 1;
    const next_page_params = hasNextPage
      ? { block_number: minBlockReturned, items_count: itemsCount }
      : null;

    res.status(200).json({ items: blocks, next_page_params });
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch blocks' });
  }
}
