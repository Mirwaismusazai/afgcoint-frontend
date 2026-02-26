import type { NextApiRequest, NextApiResponse } from 'next';

import type { SearchResultItem } from 'types/api/search';

import { parseSearchQuery } from './parseSearchQuery';

function buildSearchResultItem(type: 'block' | 'transaction' | 'address', parameter: string): SearchResultItem | null {
  switch (type) {
    case 'block':
      return {
        type: 'block',
        block_number: parameter,
        block_hash: '',
        timestamp: '',
      };
    case 'transaction':
      return {
        type: 'transaction',
        transaction_hash: parameter,
        timestamp: '',
      };
    case 'address':
      return {
        type: 'address',
        address_hash: parameter,
        name: null,
        is_smart_contract_verified: false,
      };
    default:
      return null;
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse<Array<SearchResultItem>>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json([]);
    return;
  }

  const q = typeof req.query.q === 'string' ? req.query.q : (req.query.q?.[0] ?? '');
  const { type, parameter } = parseSearchQuery(q);

  const item = type !== null ? buildSearchResultItem(type, parameter) : null;
  const items: Array<SearchResultItem> = item ? [ item ] : [];

  res.status(200).json(items);
}
