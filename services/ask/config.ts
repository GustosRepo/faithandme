export const askScriptureConfig = {
  apiBaseUrl: process.env.EXPO_PUBLIC_FAITH_API_URL?.replace(/\/+$/, '') || (__DEV__ ? 'http://localhost:3000' : ''),
  questionMinLength: 8,
  questionMaxLength: 800,
  // Candidate passages sent to the server; the model chooses the best fits.
  maxPassages: 8,
  maxTotalPassageTextLength: 5500,
} as const;
