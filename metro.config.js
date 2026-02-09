const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// 👇 ADD THIS
config.resolver.assetExts.push("glb");

module.exports = config;
