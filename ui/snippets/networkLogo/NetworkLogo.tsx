import { chakra } from "@chakra-ui/react";
import React from "react";

import { route } from "nextjs-routes";

import config from "configs/app";
import { useColorModeValue } from "toolkit/chakra/color-mode";
import { Image } from "toolkit/chakra/image";
import IconSvg from "ui/shared/IconSvg";

import { INVERT_FILTER } from "./consts";

const LogoFallback = () => {
  return (
    <IconSvg
      name="networks/logo-placeholder"
      width="120px"
      height="24px"
      color={{ base: "blue.600", _dark: "white" }}
      aria-label="Network logo placeholder"
    />
  );
};

type Props = {
  className?: string;
};

const NetworkLogo = ({ className, isBig }: Props) => {
  // const logoSrc = useColorModeValue(config.UI.navigation.logo.default, config.UI.navigation.logo.dark || config.UI.navigation.logo.default);
  const logoSrc = "/assets/branding/afgcoin-logo-v3-100px.png";

  return (
    <chakra.a
      className={className}
      href={route({ pathname: "/" })}
      aria-label="Link to main page"
    >
      <Image
        h={isBig ? "200px" : "70px"}
        skeletonWidth={isBig ? "600px" : "220px"}
        src={logoSrc}
        alt={`${config.chain.name} network logo`}
        fallback={<LogoFallback />}
        filter={{
          _dark: !config.UI.navigation.logo.dark ? INVERT_FILTER : undefined,
        }}
        objectFit="contain"
        objectPosition="left"
      />
    </chakra.a>
  );
};

export default React.memo(chakra(NetworkLogo));
