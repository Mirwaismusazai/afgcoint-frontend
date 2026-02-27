import { Text } from '@chakra-ui/react';
import React from 'react';

import type { Transaction } from 'types/api/transaction';

import useApiQuery from 'lib/api/useApiQuery';
import { Skeleton } from 'toolkit/chakra/skeleton';
import NativeCoinValue from 'ui/shared/value/NativeCoinValue';

type Props = {
  tx: Transaction;
  isLoading?: boolean;
  accuracy?: number;
  color?: string;
  noUsd?: boolean;
};

/**
 * Displays transaction value on the homepage: AFG token transfer amount when present (from logs),
 * otherwise native chain value. Matches Transaction details page behavior without changing API shape.
 */
const HomepageTxValue = ({ tx, isLoading, accuracy = 5, color = 'text.secondary', noUsd }: Props) => {
  const afgQuery = useApiQuery('general:tx_afg_value', {
    pathParams: { hash: tx.hash },
    queryOptions: {
      enabled: Boolean(tx?.hash && !isLoading),
      staleTime: 60_000,
    },
  });

  const afgValue = afgQuery.data?.value;
  const showAfg = afgValue != null && afgValue !== '' && !afgQuery.isError;

  if (isLoading) {
    return (
      <Skeleton loading>
        <Text as="span" color={ color }>–</Text>
      </Skeleton>
    );
  }

  if (showAfg) {
    const formatted = Number(afgValue).toLocaleString(undefined, { maximumFractionDigits: 18 });
    return (
      <Skeleton loading={ afgQuery.isPlaceholderData }>
        <Text as="span" color={ color }>{ formatted } AFG</Text>
      </Skeleton>
    );
  }

  return (
    <NativeCoinValue
      amount={ tx.value }
      accuracy={ accuracy }
      loading={ false }
      color={ color }
      noUsd={ noUsd }
    />
  );
};

export default React.memo(HomepageTxValue);
