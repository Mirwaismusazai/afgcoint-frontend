import { chakra } from "@chakra-ui/react";
import React from "react";

import { route } from "nextjs-routes";

import config from "configs/app";
import { Image } from "toolkit/chakra/image";

const AFGSCAN_LOGO_PATH = "/assets/branding/afgcoin-logo-v3-100px.png";

type Props = {
  className?: string;
  isBig?: boolean;
};

const NetworkLogo = ({ className, isBig }: Props) => {
  return (
    <chakra.a
      className={className}
      href={route({ pathname: "/" })}
      aria-label="Link to main page"
    >
      <Image
        h={isBig ? "200px" : "70px"}
        skeletonWidth={isBig ? "600px" : "220px"}
        src={AFGSCAN_LOGO_PATH}
        alt="AFGScan logo"
        objectFit="contain"
        objectPosition="left"
      />
    </chakra.a>
  );
};

export default React.memo(chakra(NetworkLogo));
