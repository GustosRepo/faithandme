export const askScriptureConfig = {
  apiBaseUrl: process.env.EXPO_PUBLIC_FAITH_API_URL?.replace(/\/+$/, '') || (__DEV__ ? 'http://localhost:3000' : ''),
  questionMinLength: 8,
  questionMaxLength: 800,
  maxPassages: 5,
} as const;
