import type { NextApiRequest, NextApiResponse } from 'next';

import type { HomeStats } from 'types/api/stats';

import { publicClient } from 'lib/web3/client';

const AFG_CONTRACT = '0x91e9d32262fb1c60575ba1c13205e5b95e5004ac';
const SECONDS_24H = 24 * 60 * 60;

const NODEREAL_ENDPOINT = process.env.NODEREAL_BSC_RPC_URL;

interface NodeRealTransfer {
  blockTimeStamp?: number;
}

interface NodeRealResult {
  transfers?: Array<NodeRealTransfer>;
  pageKey?: string;
}

/** Count transfers in last 24h via NodeReal (same as transactions/stats). Returns 0 if disabled or error. */
async function getTotalTransactions24h(): Promise<number> {
  if (!NODEREAL_ENDPOINT) return 0;

  const nowSec = Math.floor(Date.now() / 1000);
  const cutoffSec = nowSec - SECONDS_24H;

  let totalCount = 0;
  let pageKey: string | undefined;
  let past24h = false;

  try {
    let done = false;
    while (!done) {
      const params: Record<string, unknown> = {
        contractAddresses: [ AFG_CONTRACT ],
        category: [ '20' ],
        maxCount: '0x64',
        order: 'desc',
      };
      if (pageKey) params.pageKey = pageKey;

      const response = await fetch(NODEREAL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'nr_getAssetTransfers',
          params: [ params ],
          id: 1,
        }),
      });

      if (!response.ok) break;

      const data = (await response.json()) as { result?: NodeRealResult; error?: { message: string } };
      if (data.error) break;

      const transfers = data.result?.transfers ?? [];
      const nextPageKey = data.result?.pageKey;

      for (const tx of transfers) {
        const ts = tx.blockTimeStamp;
        if (typeof ts !== 'number') continue;
        if (ts < cutoffSec) {
          past24h = true;
          break;
        }
        totalCount += 1;
      }

      done = past24h || !nextPageKey;
      if (!done) pageKey = nextPageKey;
    }
  } catch {
    // return 0 on any error
  }

  return totalCount;
}

/** Stub values for fields that require an indexer; RPC provides total_blocks, average_block_time; NodeReal provides total_transactions (24h). */
const STUB_HOME_STATS: Omit<HomeStats, 'total_blocks' | 'average_block_time' | 'total_transactions'> = {
  total_addresses: '0',
  coin_image: null,
  coin_price: null,
  coin_price_change_percentage: null,
  total_gas_used: '0',
  transactions_today: null,
  gas_used_today: '0',
  gas_prices: null,
  gas_price_updated_at: null,
  gas_prices_update_in: 0,
  static_gas_price: null,
  market_cap: null,
  network_utilization_percentage: 0,
  tvl: null,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<HomeStats | { error: string }>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let total_blocks = '0';
  let average_block_time = 0;
  let total_transactions = '0';

  if (publicClient) {
    try {
      const latest = await publicClient.getBlockNumber();
      total_blocks = String(latest);

      if (latest > BigInt(0)) {
        const [ blockLatest, blockPrev ] = await Promise.all([
          publicClient.getBlock({ blockNumber: latest }),
          publicClient.getBlock({ blockNumber: latest - BigInt(1) }),
        ]);
        if (blockLatest?.timestamp != null && blockPrev?.timestamp != null) {
          const diffSec = Number(blockLatest.timestamp - blockPrev.timestamp);
          average_block_time = Math.round(diffSec * 1000);
        }
      }
    } catch {
      // keep stub values on RPC error
    }
  }

  const count24h = await getTotalTransactions24h();
  if (count24h > 0) {
    total_transactions = String(count24h);
  }

  const body: HomeStats = {
    ...STUB_HOME_STATS,
    total_blocks,
    total_transactions,
    average_block_time,
  };

  res.status(200).json(body);
}
