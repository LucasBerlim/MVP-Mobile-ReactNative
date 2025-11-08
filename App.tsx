import * as React from "react";
import { StatusBar, useColorScheme } from "react-native";
import {
  NavigationContainer,
  DefaultTheme as NavLight,
  DarkTheme as NavDark,
} from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  Provider as PaperProvider,
  MD3LightTheme,
  MD3DarkTheme,
  MD3Theme,
} from "react-native-paper";
import { AuthProvider } from "./src/context/authContext";
import Routes from "./src/routes";
import NetworkStatus from "./src/components/NetworkInfo/NetWorkInfo";

const GREEN = {
  primary: "#2E7D32",
  onPrimary: "#FFFFFF",
  primaryContainer: "#A5D6A7",
  onPrimaryContainer: "#0A290F",

  secondary: "#66BB6A",
  onSecondary: "#0B2810",
  secondaryContainer: "#C8E6C9",
  onSecondaryContainer: "#08210B",

  tertiary: "#A5D6A7",
  onTertiary: "#0F2A12",

  surface: "#FFFFFF",
  surfaceVariant: "#E8F3EC",
  background: "#F5F7F5",
  outline: "#8FB79A",
  surfaceTint: "#2E7D32",
};

const GREEN_DARK = {
  primary: "#8CD99B",
  onPrimary: "#083415",
  primaryContainer: "#1C3B26",
  onPrimaryContainer: "#B9EABF",

  secondary: "#6EE7A0",
  onSecondary: "#05210F",
  secondaryContainer: "#144426",
  onSecondaryContainer: "#C6F6D5",

  tertiary: "#9BE3B4",
  onTertiary: "#072815",

  surface: "#101410",
  surfaceVariant: "#1A241B",
  background: "#0B0F0B",
  outline: "#2E4D35",
  surfaceTint: "#8CD99B",
};

function withGreen(theme: MD3Theme, dark: boolean): MD3Theme {
  const p = dark ? GREEN_DARK : GREEN;
  return {
    ...theme,
    colors: {
      ...theme.colors,

      primary: p.primary,
      onPrimary: p.onPrimary,
      primaryContainer: p.primaryContainer,
      onPrimaryContainer: p.onPrimaryContainer,

      secondary: p.secondary,
      onSecondary: p.onSecondary,
      secondaryContainer: p.secondaryContainer,
      onSecondaryContainer: p.onSecondaryContainer,

      tertiary: p.tertiary,
      onTertiary: p.onTertiary,

      surface: p.surface,
      surfaceVariant: p.surfaceVariant,
      background: p.background,

      outline: p.outline,
    },
    roundness: 10,
  };
}

function useSyncedThemes(colorScheme: "light" | "dark") {
  const basePaper = colorScheme === "dark" ? MD3DarkTheme : MD3LightTheme;
  const paperTheme = withGreen(basePaper, colorScheme === "dark");

  const navBase = colorScheme === "dark" ? NavDark : NavLight;
  const navTheme = {
    ...navBase,
    colors: {
      ...navBase.colors,
      background: paperTheme.colors.background as string,
      card:
        (paperTheme.colors as any)?.elevation?.level2 ??
        paperTheme.colors.surface,
      text: paperTheme.colors.onSurface as string,
      primary: paperTheme.colors.primary as string,
      border: paperTheme.colors.outline as string,
    },
  };

  return { paperTheme, navTheme };
}

export default function App() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const { paperTheme, navTheme } = useSyncedThemes(scheme);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <StatusBar
            barStyle={scheme === "dark" ? "light-content" : "dark-content"}
            backgroundColor="transparent"
            translucent
          />
          <AuthProvider>
            <NavigationContainer theme={navTheme}>
              <NetworkStatus />
              <Routes />
            </NavigationContainer>
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
