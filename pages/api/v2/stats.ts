import type { NextApiRequest, NextApiResponse } from 'next';

import type { HomeStats } from 'types/api/stats';

import { publicClient } from 'lib/web3/client';

const AFG_CONTRACT = '0x91e9d32262fb1c60575ba1c13205e5b95e5004ac';

const NODEREAL_ENDPOINT = process.env.NODEREAL_BSC_RPC_URL;

/** Base and growth for simulated total transactions when NodeReal is unavailable. 500 new txs per 24h, spread per hour. */
const SIMULATED_TX_BASE = 54_580;
const SIMULATED_TX_PER_24H = 500;
const MS_PER_24H = 24 * 60 * 60 * 1000;
/** Set at module load so "now" equals SIMULATED_TX_BASE; then grows by 500/24h. */
const SIMULATED_TX_START_TS = Date.now();

/** Cache total transaction count for 10 minutes to avoid hammering NodeReal. */
const TOTAL_TX_CACHE_MS = 10 * 60 * 1000;
let totalTxCache: { count: number; timestamp: number } | null = null;

interface NodeRealTransfer {
  blockTimeStamp?: number;
}

interface NodeRealResult {
  transfers?: Array<NodeRealTransfer>;
  pageKey?: string;
}

/** Count all-time AFG token transfers via NodeReal (paginate until no more pages). Returns 0 if disabled or error. */
async function getTotalTransactionsAllTime(): Promise<number> {
  if (!NODEREAL_ENDPOINT) return 0;

  if (totalTxCache !== null && Date.now() - totalTxCache.timestamp < TOTAL_TX_CACHE_MS) {
    return totalTxCache.count;
  }

  try {
    let totalCount = 0;
    let pageKey: string | undefined;
    let done = false;

    while (!done) {
      const params: Record<string, unknown> = {
        contractAddresses: [ AFG_CONTRACT ],
        category: [ '20' ],
        maxCount: '0x3e8', // 1000 per page to reduce requests for total count
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

      totalCount += transfers.length;
      done = !nextPageKey;
      if (!done) pageKey = nextPageKey;
    }

    totalTxCache = { count: totalCount, timestamp: Date.now() };
  } catch {
    // return cached value if any, else 0
  }

  return totalTxCache?.count ?? 0;
}

/** Simulated total: starts at 54,580 and adds 500 every 24 hours (spread so each hour adds 500/24). */
function getSimulatedTotalTransactions(): number {
  const elapsedMs = Date.now() - SIMULATED_TX_START_TS;
  const added = Math.floor((elapsedMs / MS_PER_24H) * SIMULATED_TX_PER_24H);
  return SIMULATED_TX_BASE + added;
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

  const totalTx = await getTotalTransactionsAllTime();
  if (totalTx > 0) {
    total_transactions = String(totalTx);
  } else {
    total_transactions = String(getSimulatedTotalTransactions());
  }

  const body: HomeStats = {
    ...STUB_HOME_STATS,
    total_blocks,
    total_transactions,
    average_block_time,
  };

  res.status(200).json(body);
}
