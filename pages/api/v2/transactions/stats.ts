import type { NextApiRequest, NextApiResponse } from 'next';

const AFG_CONTRACT = '0x91e9d32262fb1c60575ba1c13205e5b95e5004ac';
const SECONDS_24H = 24 * 60 * 60;

const NODEREAL_ENDPOINT = process.env.NODEREAL_BSC_RPC_URL!;

interface NodeRealTransfer {
  blockTimeStamp?: number;
}

interface NodeRealResult {
  transfers?: Array<NodeRealTransfer>;
  pageKey?: string;
}

interface FetchResult {
  transfers: Array<NodeRealTransfer>;
  pageKey: string | undefined;
}

async function fetchTransfers(pageKey: string | undefined): Promise<FetchResult> {
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

  if (!response.ok) {
    throw new Error(`NodeReal returned ${ response.status }`);
  }

  const data = (await response.json()) as { result?: NodeRealResult; error?: { message: string } };
  if (data.error) {
    throw new Error(data.error.message ?? 'NodeReal API error');
  }

  return {
    transfers: data.result?.transfers ?? [],
    pageKey: data.result?.pageKey,
  };
}

/** Blockscout TransactionsStats shape – must match types/api/transaction.TransactionsStats */
function statsResponse(count24h: number): {
  pending_transactions_count: string;
  transaction_fees_avg_24h: string;
  transaction_fees_sum_24h: string;
  transactions_count_24h: string;
} {
  return {
    transactions_count_24h: String(count24h),
    pending_transactions_count: '0',
    transaction_fees_sum_24h: '0',
    transaction_fees_avg_24h: '0',
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!NODEREAL_ENDPOINT) {
    res.status(500).json({ error: 'NODEREAL_BSC_RPC_URL is not configured' });
    return;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const cutoffSec = nowSec - SECONDS_24H;

  let totalCount = 0;
  let pageKey: string | undefined;
  let past24h = false;

  try {
    do {
      const { transfers, pageKey: nextPageKey } = await fetchTransfers(pageKey);

      for (const tx of transfers) {
        const ts = tx.blockTimeStamp;
        if (typeof ts !== 'number') continue;
        if (ts < cutoffSec) {
          past24h = true;
          break;
        }
        totalCount += 1;
      }

      if (past24h || !nextPageKey) break;
      pageKey = nextPageKey;
    } while (true);
  } catch (err) {
    console.error('NodeReal stats fetch failed:', err);
    res.status(502).json(statsResponse(0));
    return;
  }

  res.status(200).json(statsResponse(totalCount));
}
