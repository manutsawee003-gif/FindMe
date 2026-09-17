const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * The development API runs over HTTP on the host machine. Ensure the native
 * manifest permits it; app.config's Android field alone is not emitted by the
 * current prebuild pipeline.
 */
module.exports = function withCleartextTraffic(config) {
  return withAndroidManifest(config, configWithManifest => {
    configWithManifest.modResults.manifest.application[0].$['android:usesCleartextTraffic'] = 'true';
    return configWithManifest;
  });
};
