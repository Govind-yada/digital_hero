import app from './app.js';
import { config } from './config/env.js';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Digital Heroes API server running on port ${PORT} [${config.nodeEnv}]`);
});
