import type { NextApiRequest, NextApiResponse } from 'next';

import type { Block } from 'types/api/block';

import { publicClient } from 'lib/web3/client';

/** Minimal AddressParam-like stub for RPC-mapped responses (no UI dependency). */
function addressParam(hash: string) {
  return {
    hash,
    name: null as string | null,
    implementations: null,
    is_contract: false,
    is_verified: false,
    ens_domain_name: null,
    private_tags: null,
    public_tags: null,
    watchlist_names: null,
  };
}

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

    const timestamp = new Date(Number(block.timestamp) * 1000).toISOString();

    const body: Block = {
      height: Number(block.number),
      timestamp,
      transactions_count: block.transactions.length,
      internal_transactions_count: 0,
      miner: addressParam(block.miner),
      size: Number(block.size),
      hash: block.hash,
      parent_hash: block.parentHash,
      difficulty: block.difficulty?.toString() ?? undefined,
      total_difficulty: block.totalDifficulty?.toString() ?? null,
      gas_used: block.gasUsed.toString(),
      gas_limit: block.gasLimit.toString(),
      nonce: block.nonce,
      base_fee_per_gas: block.baseFeePerGas?.toString() ?? null,
      burnt_fees: null,
      priority_fee: null,
      extra_data: block.extraData,
      state_root: block.stateRoot,
      gas_target_percentage: null,
      gas_used_percentage: null,
      burnt_fees_percentage: null,
      type: 'block',
      transaction_fees: null,
      uncles_hashes: block.uncles,
      withdrawals_count: block.withdrawals?.length,
    };

    res.status(200).json(body);
  } catch (err) {
    res.status(404).json({ error: 'Block not found' });
  }
}
