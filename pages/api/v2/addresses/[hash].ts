import type { NextApiRequest, NextApiResponse } from 'next';

import type { Address } from 'types/api/address';

import { publicClient } from 'lib/web3/client';

function getHash(query: NextApiRequest['query']): string | null {
  const v = query.hash;
  if (typeof v === 'string' && v) return v;
  if (Array.isArray(v) && v[0]) return v[0];
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Address | { error: string }>) {
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

  const address = hash as `0x${ string }`;

  try {
    const [ balance, code ] = await Promise.all([
      publicClient.getBalance({ address }).catch(() => null),
      publicClient.getCode({ address }).catch(() => null),
    ]);

    if (balance === null) {
      res.status(404).json({ error: 'Address not found' });
      return;
    }

    const isContract = Boolean(code && code !== '0x');

    const body: Address = {
      hash,
      coin_balance: balance.toString(),
      block_number_balance_updated_at: null,
      creator_address_hash: null,
      creation_transaction_hash: null,
      creation_status: null,
      exchange_rate: null,
      ens_domain_name: null,
      has_logs: false,
      has_token_transfers: false,
      has_tokens: false,
      has_validated_blocks: false,
      implementations: null,
      is_contract: isContract,
      is_verified: false,
      name: null,
      token: null,
      watchlist_address_id: null,
      private_tags: null,
      public_tags: null,
      watchlist_names: null,
    };

    res.status(200).json(body);
  } catch {
    res.status(404).json({ error: 'Address not found' });
  }
}
