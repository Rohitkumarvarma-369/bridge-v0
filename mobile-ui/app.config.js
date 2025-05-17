module.exports = {
  name: "Bridge Mobile",
  slug: "bridge-mobile",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "bridge",
  userInterfaceStyle: "light",
  entryPoint: "./App.tsx",
  splash: {
    image: "./assets/images/icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.bridge.mobile"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.bridge.mobile"
  },
  web: {
    bundler: "metro",
    favicon: "./assets/images/icon.png"
  },
  plugins: [
    "expo-router"
  ]
}; 