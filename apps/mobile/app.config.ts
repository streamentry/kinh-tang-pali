import type { ExpoConfig } from 'expo/config';
import tokens from '../../source/design-tokens.json';

const color = (name: 'paper' | 'accent') => '#' + tokens[name].$value.components
  .map(value => Math.round(value * 255).toString(16).padStart(2, '0')).join('');
const variant = process.env.EXPO_PUBLIC_APP_VARIANT ?? 'production';
if (!['production', 'preview'].includes(variant)) {
  throw new Error('EXPO_PUBLIC_APP_VARIANT must be production or preview.');
}
const preview = variant === 'preview';
const applicationId = `io.github.streamentry.kinhtangpali${preview ? '.preview' : ''}`;
const site = new URL(process.env.EXPO_PUBLIC_SITE_URL ?? 'https://streamentry.github.io/kinh-tang-pali/');
const localHttp = site.protocol === 'http:';
if (!['http:', 'https:'].includes(site.protocol) || site.username || site.password || site.search || site.hash) {
  throw new Error('EXPO_PUBLIC_SITE_URL must be an HTTP(S) website base URL without credentials, query, or hash.');
}
if (process.env.EAS_BUILD_PROFILE === 'production' && localHttp) {
  throw new Error('Production builds must use an HTTPS website.');
}
if (process.env.EAS_BUILD_PROFILE === 'production' && preview) {
  throw new Error('The production EAS profile must use the production app variant.');
}

const config: ExpoConfig = {
  name: preview ? 'Kinh Tạng Pāli Preview' : 'Kinh Tạng Pāli',
  slug: 'kinh-tang-pali',
  version: '0.1.0',
  scheme: preview ? 'kinhtangpali-preview' : 'kinhtangpali',
  platforms: ['ios', 'android'],
  userInterfaceStyle: 'light',
  orientation: 'default',
  icon: './assets/icon.png',
  backgroundColor: color('paper'),
  ios: {
    bundleIdentifier: applicationId,
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      ...(localHttp ? { NSAppTransportSecurity: { NSAllowsLocalNetworking: true } } : {}),
    },
  },
  android: {
    package: applicationId,
    adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: color('accent') },
    blockedPermissions: ['android.permission.RECORD_AUDIO'],
  },
  plugins: [
    ['expo-audio', { microphonePermission: false, recordAudioAndroid: false, enableBackgroundPlayback: true, enableBackgroundRecording: false }],
    'expo-sqlite',
    'expo-sharing',
    ['expo-build-properties', { android: { usesCleartextTraffic: localHttp } }],
    ['expo-splash-screen', { image: './assets/splash-icon.png', imageWidth: 96, backgroundColor: color('paper') }],
  ],
};

export default config;
