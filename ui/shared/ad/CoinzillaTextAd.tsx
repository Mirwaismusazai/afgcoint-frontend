import { Box, Text, chakra } from '@chakra-ui/react';
import React, { useEffect } from 'react';

import { Image } from 'toolkit/chakra/image';
import { Link } from 'toolkit/chakra/link';
import { Skeleton } from 'toolkit/chakra/skeleton';
import { ndash } from 'toolkit/utils/htmlEntities';
import { isBrowser } from 'toolkit/utils/isBrowser';

type AdData = {
  ad: {
    name: string;
    description_short: string;
    thumbnail: string;
    url: string;
    cta_button: string;
    impressionUrl?: string;
  };
};

// const MOCK: AdData = {
//   ad: {
//     url: 'https://unsplash.com/s/photos/cute-kitten',
//     thumbnail: 'https://raw.githubusercontent.com/blockscout/frontend-configs/main/configs/network-icons/gnosis.svg',
//     name: 'All about kitties',
//     description_short: 'To see millions picture of cute kitties',
//     cta_button: 'click here',
//   },
// };

const CoinzillaTextAd = ({ className }: { className?: string }) => {
  const [ adData, setAdData ] = React.useState<AdData | null>(null);
  const [ isLoading, setIsLoading ] = React.useState(true);

  useEffect(() => {
    if (isBrowser()) {
      fetch('https://request-global.czilladx.com/serve/native.php?z=19260bf627546ab7242')
        .then(res => res.status === 200 ? res.json() : null)
        .then((_data) => {
          const data = _data as AdData;
          setAdData(data);
          if (data?.ad?.impressionUrl) {
            fetch(data.ad.impressionUrl);
          }
        })
        .finally(() => {
          // setAdData(MOCK);
          setIsLoading(false);
        });
    }
  }, [ ]);

  // Advertisement display commented out (reversible)
  // if (isLoading) {
  //   return (
  //     <Skeleton
  //       loading
  //       className={ className }
  //       h={{ base: 12, lg: 6 }}
  //       w="100%"
  //       flexGrow={ 1 }
  //       maxW="800px"
  //       display="block"
  //     />
  //   );
  // }
  // if (!adData) {
  //   return null;
  // }
  // const urlObject = new URL(adData.ad.url);
  // return (
  //   <Box
  //     className={ className }
  //     display={{ base: 'flex', lg: 'block' }}
  //     textStyle={{ base: 'xs', lg: 'md' }}
  //     color={{ base: 'text.secondary', lg: 'text.primary' }}
  //   >
  //     <Text ... />
  //     ...
  //   </Box>
  // );
  return null;
};

export default chakra(CoinzillaTextAd);
