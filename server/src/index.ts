import { createApp } from './app.js';
import { assertProductionConfig, serverConfig } from './config.js';

assertProductionConfig();

const app = createApp();

app.listen(serverConfig.port, '0.0.0.0', () => {
  console.info(JSON.stringify({ event: 'server_started', port: serverConfig.port }));
});
