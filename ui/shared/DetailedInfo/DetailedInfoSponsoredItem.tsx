import React from 'react';

import config from 'configs/app';
import * as cookies from 'lib/cookies';
import AdBanner from 'ui/shared/ad/AdBanner';

import * as DetailedInfo from './DetailedInfo';

const feature = config.features.adsBanner;

interface Props {
  isLoading?: boolean;
}

const DetailedInfoSponsoredItem = ({ isLoading }: Props) => {
  const hasAdblockCookie = cookies.get(cookies.NAMES.ADBLOCK_DETECTED);

  if (!feature.isEnabled || hasAdblockCookie === 'true') {
    return null;
  }

  // Advertisement: sponsored banner display commented out (reversible)
  // return (
  //   <>
  //     <DetailedInfo.ItemLabel hint="Sponsored banner advertisement" isLoading={ isLoading }>Sponsored</DetailedInfo.ItemLabel>
  //     <DetailedInfo.ItemValue mt={{ base: 0, lg: 1 }}>
  //       <AdBanner format="responsive" isLoading={ isLoading }/>
  //     </DetailedInfo.ItemValue>
  //   </>
  // );
  return null;
};

export default React.memo(DetailedInfoSponsoredItem);
