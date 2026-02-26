import { Flex, chakra } from '@chakra-ui/react';
import { SliseAd } from '@slise/embed-react';
import React from 'react';

import type { BannerProps } from './types';

import config from 'configs/app';

import {
  DESKTOP_BANNER_HEIGHT,
  DESKTOP_BANNER_WIDTH,
  MOBILE_BANNER_HEIGHT,
  MOBILE_BANNER_WIDTH,
} from './consts';

const SliseBanner = ({ className, format = 'responsive' }: BannerProps) => {

  // Advertisement display commented out (reversible)
  // if (format === 'desktop') { return ( <Flex>...</Flex> ); }
  // if (format === 'mobile') { return ( <Flex>...</Flex> ); }
  // return ( <> ... SliseAd ... </> );
  return null;
};

export default chakra(SliseBanner);
