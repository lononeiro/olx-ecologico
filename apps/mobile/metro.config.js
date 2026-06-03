// Learn more: https://docs.expo.dev/guides/monorepos/
// Expo SDK 54's getDefaultConfig already handles this monorepo (watchFolders,
// nodeModulesPaths). We intentionally do NOT override those — doing so shifts
// Metro's server root to the monorepo root and breaks entry resolution.
//
// The only thing we add: force a single copy of React / React Native packages.
// The workspace root ships React 18 for Next.js. This app uses Expo SDK 54,
// React 19, and React Native 0.81. Letting Metro resolve from the root can load
// RN 0.76 JS against an RN 0.81 native binary, which crashes TurboModules.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

const forcedSingletons = {
  react: require.resolve("react", { paths: [projectRoot] }),
  "react-dom": require.resolve("react-dom", { paths: [projectRoot] }),
  "react-native": require.resolve("react-native", { paths: [projectRoot] }),
  "react-native-web": require.resolve("react-native-web", { paths: [projectRoot] }),
  "expo-router": require.resolve("expo-router", { paths: [projectRoot] }),
};

config.transformer.babelTransformerPath = require.resolve(
  "@expo/metro-config/babel-transformer",
  { paths: [projectRoot] }
);
config.transformer.unstable_allowRequireContext = true;

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const forced = forcedSingletons[moduleName];
  if (forced) {
    return { type: "sourceFile", filePath: forced };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
