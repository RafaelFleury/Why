const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add wasm to asset extensions for expo-sqlite web support
config.resolver.assetExts = [...(config.resolver.assetExts || []), "wasm"];

// Add COOP/COEP headers required by expo-sqlite web (SharedArrayBuffer)
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      return middleware(req, res, next);
    };
  },
};

module.exports = withNativeWind(config, { input: "./global.css" });
