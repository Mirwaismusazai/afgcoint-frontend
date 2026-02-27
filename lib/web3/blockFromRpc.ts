import type { Block as BlockType } from 'viem';

import type { Block } from 'types/api/block';

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

/** Map a viem/RPC block to the explorer Block type. */
export function blockFromRpc(block: BlockType): Block {
  const timestamp = new Date(Number(block.timestamp) * 1000).toISOString();
  return {
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
}
