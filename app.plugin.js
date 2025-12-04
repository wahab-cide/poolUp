const { withAndroidManifest } = require('@expo/config-plugins');

function withCustomAndroidManifest(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    
    // Find the application element
    const application = androidManifest.manifest.application[0];
    
    // Find existing Google Maps API key meta-data or create new one
    let googleMapsMetaData = application['meta-data']?.find(
      (item) => item.$['android:name'] === 'com.google.android.geo.API_KEY'
    );
    
    if (googleMapsMetaData) {
      // Update existing meta-data with actual API key value from environment
      // Don't set a fake key - let the build fail if env var is missing
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
      if (apiKey) {
        googleMapsMetaData.$['android:value'] = apiKey;
      }
    } else {
      // Create new meta-data element
      if (!application['meta-data']) {
        application['meta-data'] = [];
      }
      application['meta-data'].push({
        $: {
          'android:name': 'com.google.android.geo.API_KEY',
          'android:value': process.env.EXPO_PUBLIC_GOOGLE_API_KEY || ''
        }
      });
    }
    
    return config;
  });
}

// Only inject Google Maps API key for Android
// iOS will use Apple Maps (PROVIDER_DEFAULT) and doesn't need Google API key
module.exports = function(config) {
  config = withCustomAndroidManifest(config);
  return config;
};