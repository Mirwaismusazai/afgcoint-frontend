import type { NextApiRequest, NextApiResponse } from 'next';

/** Stub for Blockscout homepage/stats when no backend is available. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  res.status(200).json({
    total_blocks: '0',
    total_addresses: '0',
    total_transactions: '0',
    average_block_time: 0,
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
  });
}
