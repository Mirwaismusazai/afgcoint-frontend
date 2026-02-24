import { chakra } from "@chakra-ui/react";
import React from "react";

import { route } from "nextjs-routes";

import { Image } from "toolkit/chakra/image";

const AFGSCAN_LOGO_PATH = "/assets/branding/afgcoin-logo-v3-100px.png";

type Props = {
  className?: string;
};

const NetworkIcon = ({ className }: Props) => {
  return (
    <chakra.a
      className={className}
      href={route({ pathname: "/" })}
      aria-label="Link to main page"
    >
      <Image
        w="30px"
        h="30px"
        src={AFGSCAN_LOGO_PATH}
        alt="AFGScan icon"
        objectFit="contain"
        objectPosition="left"
      />
    </chakra.a>
  );
};

export default React.memo(chakra(NetworkIcon));
