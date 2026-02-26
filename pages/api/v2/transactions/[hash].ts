import type { NextApiRequest, NextApiResponse } from 'next';

import type { Transaction } from 'types/api/transaction';

import hexToDecimal from 'lib/hexToDecimal';
import { publicClient } from 'lib/web3/client';

/** Minimal AddressParam-like stub for RPC-mapped responses (no UI dependency). */
function addressParam(hash: string, isContract = false) {
  return {
    hash,
    name: null as string | null,
    implementations: null,
    is_contract: isContract,
    is_verified: false,
    ens_domain_name: null,
    private_tags: null,
    public_tags: null,
    watchlist_names: null,
  };
}

function getHash(query: NextApiRequest['query']): string | null {
  const v = query.hash;
  if (typeof v === 'string' && v) return v;
  if (Array.isArray(v) && v[0]) return v[0];
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Transaction | { error: string }>) {
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

  const txHash = hash as `0x${ string }`;

  try {
    const tx = await publicClient.getTransaction({ hash: txHash });

    if (!tx) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    const [ txReceipt, block ] = await Promise.all([
      publicClient.getTransactionReceipt({ hash: txHash }).catch(() => null),
      tx.blockHash ? publicClient.getBlock({ blockHash: tx.blockHash }).catch(() => null) : null,
    ]);

    const status = txReceipt
      ? (txReceipt.status === 'success' ? 'ok' : 'error')
      : null;
    const gasPrice = txReceipt?.effectiveGasPrice ?? tx.gasPrice;
    const timestamp = block?.timestamp
      ? new Date(Number(block.timestamp) * 1000).toISOString()
      : null;

    let confirmations = 0;
    if (block && tx.blockNumber) {
      const latest = await publicClient.getBlock().catch(() => null);
      if (latest) {
        const conf = latest.number - block.number + BigInt(1);
        confirmations = conf > 0 ? Number(conf) : 0;
      }
    }

    const body: Transaction = {
      from: addressParam(tx.from),
      to: tx.to ? addressParam(tx.to) : null,
      hash: tx.hash,
      result: '',
      confirmations,
      status: status ?? undefined,
      block_number: tx.blockNumber ? Number(tx.blockNumber) : null,
      timestamp,
      confirmation_duration: null,
      value: tx.value.toString(),
      fee: {
        type: 'actual',
        value: txReceipt && gasPrice ? (txReceipt.gasUsed * gasPrice).toString() : null,
      },
      gas_price: gasPrice?.toString() ?? null,
      base_fee_per_gas: block?.baseFeePerGas?.toString() ?? null,
      max_fee_per_gas: tx.maxFeePerGas?.toString() ?? null,
      max_priority_fee_per_gas: tx.maxPriorityFeePerGas?.toString() ?? null,
      nonce: tx.nonce,
      position: tx.transactionIndex,
      type: tx.typeHex ? hexToDecimal(tx.typeHex) : null,
      raw_input: tx.input,
      gas_used: txReceipt?.gasUsed?.toString() ?? null,
      gas_limit: tx.gas.toString(),
      created_contract: txReceipt?.contractAddress
        ? addressParam(txReceipt.contractAddress, true)
        : null,
      priority_fee: null,
      transaction_burnt_fee: null,
      revert_reason: null,
      decoded_input: null,
      has_error_in_internal_transactions: null,
      token_transfers: null,
      token_transfers_overflow: false,
      exchange_rate: null,
      method: null,
      transaction_types: [],
      transaction_tag: null,
      actions: [],
    };

    res.status(200).json(body);
  } catch {
    res.status(404).json({ error: 'Transaction not found' });
  }
}
