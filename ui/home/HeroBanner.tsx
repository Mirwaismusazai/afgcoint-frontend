// HeroBanner.tsx
// AFGCoin branded Hero Banner (gold, elegant, no ads)

// eslint-disable-next-line no-restricted-imports
import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import React from "react";

import useIsMobile from "lib/hooks/useIsMobile";
import RewardsButton from "ui/rewards/RewardsButton";
import SearchBar from "ui/snippets/searchBar/SearchBarDesktop";
import SearchBarMobile from "ui/snippets/searchBar/SearchBarMobile";
import UserProfileDesktop from "ui/snippets/user/profile/UserProfileDesktop";
import UserWalletDesktop from "ui/snippets/user/wallet/UserWalletDesktop";
import NetworkLogo from "ui/snippets/networkLogo/NetworkLogo";
import config from "configs/app";

/* ===============================
   AFGCoin BRAND CONSTANTS
================================ */
const GOLD_GRADIENT =
  "linear-gradient(135deg, #CEB05D 0%, #DFB526 40%, #B88F33 100%)";

const DARK_TEXT = "#0B0E14";
const MUTED_DARK_TEXT = "rgba(11, 14, 20, 0.75)";

const HeroBanner = () => {
  const isMobile = useIsMobile();

  return (
    <Flex
      w="100%"
      background={GOLD_GRADIENT}
      borderRadius="lg"
      p={{ base: 5, lg: 10 }}
      columnGap={10}
      alignItems="center"
      justifyContent="space-between"
      boxShadow="0 12px 40px rgba(206,176,93,0.35)"
    >
      {/* LEFT SIDE: TEXT + SEARCH */}
      <Box flexGrow={1}>
        <Flex mb={{ base: 3, lg: 4 }} direction="column" gap={2}>
          {/* Title row with logo on the right */}
          <Flex
            alignItems="center"
            gap={{ base: 2.5, lg: 3 }}
            wrap="wrap"
            justifyContent="space-between"
          >
            {/* LEFT: Title + Coming Soon */}
            <Flex alignItems="center" gap={3} wrap="wrap">
              <Heading
                as="h1"
                fontSize={{ base: "22px", lg: "36px" }}
                lineHeight={{ base: "28px", lg: "42px" }}
                fontWeight={800}
                color={DARK_TEXT}
                letterSpacing="0.4px"
              >
                AFGCoin
              </Heading>

              {/* Elegant animated "Coming Soon" badge */}
              {/* <Box
                position="relative"
                px={{ base: 2.5, lg: 3 }}
                py={{ base: 1, lg: 1.5 }}
                borderRadius="full"
                bg="rgba(255,255,255,0.22)"
                border="1px solid rgba(11,14,20,0.14)"
                overflow="hidden"
                boxShadow="0 6px 16px rgba(11,14,20,0.10)"
                transition="transform 250ms ease, box-shadow 250ms ease, opacity 250ms ease"
                _hover={{
                  transform: "translateY(-1px)",
                  boxShadow: "0 10px 22px rgba(11,14,20,0.14)",
                  opacity: 0.98,
                }}
              > */}
              {/* Shimmer overlay */}
              {/* <Box
                  position="absolute"
                  top="-40%"
                  left="-60%"
                  w="60%"
                  h="180%"
                  transform="rotate(25deg)"
                  bg="linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)"
                  opacity={0.6}
                  animation="afgShimmer 2.8s ease-in-out infinite"
                  pointerEvents="none"
                /> */}

              {/* <Text
                  fontSize={{ base: "16px", lg: "20px" }}
                  fontWeight={700}
                  textTransform="uppercase"
                  letterSpacing="1.4px"
                  color={DARK_TEXT}
                  opacity={0.78}
                  lineHeight="1"
                  whiteSpace="nowrap"
                >
                  Coming Soon...
                </Text> */}

              {/* Local keyframes (works in Chakra via sx) */}
              {/* <Box
                  sx={{
                    "@keyframes afgShimmer": {
                      "0%": { transform: "translateX(0) rotate(25deg)" },
                      "100%": { transform: "translateX(240%) rotate(25deg)" },
                    },
                  }}
                />
              </Box> */}
            </Flex>

            {/* RIGHT: Logo */}
            <Box
              h={{ base: "18px", lg: "22px" }}
              w={{ base: "92px", lg: "108px" }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              marginTop="20px"
            >
              <NetworkLogo isBig={isMobile === true ? false : true} />
            </Box>
          </Flex>
          <Text
            fontSize={{ base: "14px", lg: "16px" }}
            color={MUTED_DARK_TEXT}
            maxW="680px"
          >
            Explore blocks, transactions, addresses, and smart contracts on the
            AFGCoin blockchain.
          </Text>

          {/* Subtle divider */}
          <Box
            mt={1}
            w="64px"
            h="3px"
            bg={DARK_TEXT}
            borderRadius="full"
            opacity={0.25}
          />
        </Flex>

        {/* SEARCH */}
        <Box>
          <Box display={{ base: "flex", lg: "none" }}>
            <SearchBarMobile isHeroBanner />
          </Box>
          <Box display={{ base: "none", lg: "flex" }}>
            <SearchBar isHeroBanner />
          </Box>
        </Box>
      </Box>

      {/* RIGHT SIDE: ACTIONS */}
      {config.UI.navigation.layout === "vertical" && (
        <Box display={{ base: "none", lg: "flex" }} alignItems="center" gap={3}>
          {config.features.rewards.isEnabled && (
            <RewardsButton variant="hero" />
          )}

          {(config.features.account.isEnabled && (
            <UserProfileDesktop buttonVariant="hero" />
          )) ||
            (config.features.blockchainInteraction.isEnabled && (
              <UserWalletDesktop buttonVariant="hero" />
            ))}
        </Box>
      )}
    </Flex>
  );
};

export default React.memo(HeroBanner);
