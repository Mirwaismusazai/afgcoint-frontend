import type { NextApiRequest, NextApiResponse } from 'next';

const AFG_CONTRACT = '0x91e9d32262fb1c60575ba1c13205e5b95e5004ac';
const AFG_DECIMALS = 18;
const CACHE_TTL_MS = 30_000;

/** Full NodeReal BSC endpoint including API key, e.g. https://bsc-mainnet.nodereal.io/v1/YOUR_API_KEY */
const NODEREAL_ENDPOINT = process.env.NODEREAL_BSC_RPC_URL!;

interface NodeRealTransfer {
  category: string;
  blockNum: string;
  from: string;
  to: string;
  value: string;
  hash: string;
  blockTimeStamp?: number;
  decimal?: string | null;
  contractAddress?: string | null;
  asset?: string | null;
}

interface NodeRealResult {
  transfers?: Array<NodeRealTransfer>;
  pageKey?: string;
}

/** Minimal Transaction-like shape so the /txs UI does not throw (e.g. on tx.fee.value). */
function transferToTransaction(tx: NodeRealTransfer, humanValue: string, blockNum: number, ts: number) {
  const from = { hash: tx.from };
  const to = { hash: tx.to };
  const timestamp = ts > 0 ? new Date(ts * 1000).toISOString() : null;
  return {
    hash: tx.hash,
    from,
    to,
    created_contract: null,
    value: humanValue,
    block_number: blockNum,
    timestamp,
    gas_price: '0',
    fee: { type: 'actual' as const, value: '0' },
    result: 'success',
    status: 'ok' as const,
    method: null as string | null,
    exchange_rate: null as string | null,
    confirmations: 0,
    confirmation_duration: null as Array<number> | null,
    type: null as number | null,
    gas_used: null as string | null,
    gas_limit: '0',
    max_fee_per_gas: null as string | null,
    max_priority_fee_per_gas: null as string | null,
    priority_fee: null as string | null,
    base_fee_per_gas: null as string | null,
    transaction_burnt_fee: null as string | null,
    nonce: 0,
    position: null as number | null,
    revert_reason: null,
    raw_input: '0x',
    decoded_input: null,
    token_transfers: null,
    token_transfers_overflow: false,
    transaction_types: [ 'token_transfer' ] as const,
    transaction_tag: null,
    actions: [],
    has_error_in_internal_transactions: false,
  };
}

interface BlockscoutTransactionsResponse {
  items: Array<ReturnType<typeof transferToTransaction>>;
  next_page_params: { pageKey: string } | null;
}

let cache: { data: BlockscoutTransactionsResponse; timestamp: number } | null = null;

function getPageKeyFromQuery(nextPageParams: string | Array<string> | undefined): string | undefined {
  if (!nextPageParams) return undefined;
  const raw = Array.isArray(nextPageParams) ? nextPageParams[0] : nextPageParams;
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as { pageKey?: string };
    return parsed.pageKey;
  } catch {
    return undefined;
  }
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

  const pageKey = getPageKeyFromQuery(req.query.next_page_params);
  const isFirstPage = pageKey === undefined;

  if (isFirstPage && cache !== null && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    res.status(200).json(cache.data);
    return;
  }

  const params: Record<string, unknown> = {
    contractAddresses: [ AFG_CONTRACT ],
    category: [ '20' ],
    maxCount: '0x32', // 50 per page – a bit more than 20, still well under NodeReal’s 1000 limit
    order: 'desc',
  };
  if (pageKey) params.pageKey = pageKey;

  const body = {
    jsonrpc: '2.0',
    method: 'nr_getAssetTransfers',
    params: [ params ],
    id: 1,
  };

  let response: Response;
  try {
    response = await fetch(NODEREAL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    // eslint-disable-next-line no-console -- API route error logging
    console.error('NodeReal fetch failed:', err);
    res.status(502).json({ error: 'Failed to fetch from NodeReal', details: String(err) });
    return;
  }

  if (!response.ok) {
    // eslint-disable-next-line no-console -- API route error logging
    console.error('NodeReal error response:', response.status, await response.text());
    res.status(502).json({ error: `NodeReal returned ${ response.status }` });
    return;
  }

  let data: { result?: NodeRealResult; error?: { message: string } };
  try {
    data = await response.json() as { result?: NodeRealResult; error?: { message: string } };
  } catch (err) {
    // eslint-disable-next-line no-console -- API route error logging
    console.error('NodeReal invalid JSON:', err);
    res.status(502).json({ error: 'Invalid NodeReal response', details: String(err) });
    return;
  }

  if (data.error) {
    // eslint-disable-next-line no-console -- API route error logging
    console.error('NodeReal error response:', data);
    res.status(502).json({ error: data.error.message ?? 'NodeReal API error' });
    return;
  }

  const transfers = data.result?.transfers ?? [];
  const items = transfers.map((tx: NodeRealTransfer) => {
    const rawValue = BigInt(tx.value);
    const decimals = tx.decimal != null && tx.decimal !== '' ?
      parseInt(tx.decimal, 10) :
      AFG_DECIMALS;
    const divisor = BigInt(Math.pow(10, decimals));
    const humanValue = (rawValue / divisor).toString();
    const blockNum = typeof tx.blockNum === 'string' && tx.blockNum.startsWith('0x') ?
      parseInt(tx.blockNum, 16) :
      Number(tx.blockNum);
    const ts = Number(tx.blockTimeStamp) || 0;
    return transferToTransaction(tx, humanValue, blockNum, ts);
  });

  const nextPageParams = data.result?.pageKey ?
    { pageKey: data.result.pageKey } :
    null;
  const result: BlockscoutTransactionsResponse = { items, next_page_params: nextPageParams };

  if (isFirstPage) {
    cache = { data: result, timestamp: Date.now() };
  }

  res.status(200).json(result);
}
