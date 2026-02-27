import type { NextApiRequest, NextApiResponse } from 'next';

import { decodeEventLog } from 'viem';

import { publicClient } from 'lib/web3/client';

const AFG_CONTRACT = '0x91e9d32262fb1c60575ba1c13205e5b95e5004ac' as const;
const AFG_DECIMALS = 18;

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' as const;

function getHash(query: NextApiRequest['query']): string | null {
  const v = query.hash;
  if (typeof v === 'string' && v) return v;
  if (Array.isArray(v) && v[0]) return v[0];
  return null;
}

/** GET /api/v2/transactions/[hash]/afg-value — returns AFG transfer total for tx from logs, or null. */
export default async function handler(req: NextApiRequest, res: NextApiResponse<{ value: string | null } | { error: string }>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const hash = getHash(req.query);
  if (!hash || !hash.startsWith('0x')) {
    res.status(400).json({ error: 'Missing or invalid hash' });
    return;
  }

  if (!publicClient) {
    res.status(503).json({ error: 'RPC client not configured' });
    return;
  }

  try {
    const receipt = await publicClient.getTransactionReceipt({ hash: hash as `0x${ string }` });
    if (!receipt) {
      res.status(200).json({ value: null });
      return;
    }

    const afgLogs = receipt.logs.filter(
      (log) => log.address.toLowerCase() === AFG_CONTRACT.toLowerCase() && log.topics[0] === TRANSFER_TOPIC,
    );

    if (afgLogs.length === 0) {
      res.status(200).json({ value: null });
      return;
    }

    let totalValue = BigInt(0);
    for (const log of afgLogs) {
      try {
        const decoded = decodeEventLog({
          abi: [
            {
              type: 'event',
              name: 'Transfer',
              inputs: [
                { name: 'from', type: 'address', indexed: true },
                { name: 'to', type: 'address', indexed: true },
                { name: 'value', type: 'uint256', indexed: false },
              ],
            },
          ],
          data: log.data,
          topics: log.topics,
        });
        if (decoded.args && typeof (decoded.args as { value?: bigint }).value === 'bigint') {
          totalValue += (decoded.args as { value: bigint }).value;
        }
      } catch {
        // skip unreadable log
      }
    }

    if (totalValue === BigInt(0)) {
      res.status(200).json({ value: null });
      return;
    }

    const divisor = BigInt(10 ** AFG_DECIMALS);
    const humanValue = totalValue / divisor;
    const remainder = totalValue % divisor;
    const valueStr = remainder === BigInt(0)
      ? String(humanValue)
      : `${ humanValue }.${ String(remainder).padStart(AFG_DECIMALS, '0').replace(/0+$/, '') }`;

    res.status(200).json({ value: valueStr });
  } catch {
    res.status(200).json({ value: null });
  }
}
