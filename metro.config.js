const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    blockList: [
      /android[\\/]app[\\/]\.cxx[\\/].*/,
      /android[\\/]app[\\/]build[\\/].*/,
      /android[\\/]\.cxx[\\/].*/,
    ],
  },
};

module.exports = mergeConfig(defaultConfig, config);