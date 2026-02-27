import type { NextApiRequest, NextApiResponse } from 'next';

import type { Transaction } from 'types/api/transaction';

import hexToDecimal from 'lib/hexToDecimal';
import { publicClient } from 'lib/web3/client';

const HOME_PAGE_TXS_COUNT = 5;

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

export default async function handler(req: NextApiRequest, res: NextApiResponse<Array<Transaction> | { error: string }>) {
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
    const block = await publicClient.getBlock({
      blockNumber: latest,
      includeTransactions: true,
    });

    if (!block || !block.transactions || block.transactions.length === 0) {
      res.status(200).json([]);
      return;
    }

    const txList = Array.isArray(block.transactions) ? block.transactions : [];
    const txsToReturn = txList.slice(0, HOME_PAGE_TXS_COUNT);

    const receipts = await Promise.all(
      txsToReturn.map((tx) =>
        publicClient.getTransactionReceipt({ hash: tx.hash as `0x${ string }` }).catch(() => null),
      ),
    );

    const transactions: Array<Transaction> = txsToReturn.map((tx, i) => {
      const txReceipt = receipts[i];
      const status = txReceipt ? (txReceipt.status === 'success' ? 'ok' : 'error') : null;
      const gasPrice = txReceipt?.effectiveGasPrice ?? tx.gasPrice;
      const timestamp = block.timestamp ? new Date(Number(block.timestamp) * 1000).toISOString() : null;
      const confirmations = 1;

      return {
        from: addressParam(tx.from),
        to: tx.to ? addressParam(tx.to) : null,
        hash: tx.hash,
        result: '',
        confirmations,
        status: status ?? undefined,
        block_number: Number(block.number),
        timestamp,
        confirmation_duration: null,
        value: tx.value.toString(),
        fee: {
          type: 'actual',
          value: txReceipt && gasPrice ? (txReceipt.gasUsed * gasPrice).toString() : null,
        },
        gas_price: gasPrice?.toString() ?? null,
        base_fee_per_gas: block.baseFeePerGas?.toString() ?? null,
        max_fee_per_gas: tx.maxFeePerGas?.toString() ?? null,
        max_priority_fee_per_gas: tx.maxPriorityFeePerGas?.toString() ?? null,
        nonce: tx.nonce,
        position: i,
        type: tx.typeHex ? hexToDecimal(tx.typeHex) : null,
        raw_input: tx.input,
        gas_used: txReceipt?.gasUsed?.toString() ?? null,
        gas_limit: tx.gas.toString(),
        created_contract: txReceipt?.contractAddress ? addressParam(txReceipt.contractAddress, true) : null,
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
    });

    res.status(200).json(transactions);
  } catch {
    res.status(502).json({ error: 'Failed to fetch transactions' });
  }
}
