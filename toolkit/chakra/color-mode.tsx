"use client";

import { ThemeProvider, useTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import * as React from "react";

export interface ColorModeProviderProps extends ThemeProviderProps {}

export type ColorMode = "dark";

export function ColorModeProvider(props: ColorModeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      scriptProps={{ "data-cfasync": "false" }}
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    />
  );
}

export function useColorMode() {
  const { setTheme } = useTheme();

  return {
    colorMode: "dark" as const,
    setColorMode: () => setTheme("dark"),
    toggleColorMode: () => setTheme("dark"),
  };
}

export function useColorModeValue<T>(_light: T, dark: T) {
  return dark;
}
