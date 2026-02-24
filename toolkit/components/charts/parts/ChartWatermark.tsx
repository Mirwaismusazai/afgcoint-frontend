import type { BoxProps } from '@chakra-ui/react';
import { Box } from '@chakra-ui/react';
import React from 'react';

const AFGSCAN_LOGO_PATH = '/assets/branding/afgcoin-logo-v3-100px.png';

export const ChartWatermark = React.memo((props: BoxProps) => {
  return (
    <Box
      position="absolute"
      opacity={ 0.1 }
      top="50%"
      left="50%"
      transform="translate(-50%, -50%)"
      pointerEvents="none"
      w="114px"
      h="20px"
      bgImage={ `url(${ AFGSCAN_LOGO_PATH })` }
      bgSize="contain"
      bgRepeat="no-repeat"
      bgPosition="center"
      { ...props }
    />
  );
});
