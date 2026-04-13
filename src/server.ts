import { createApp } from './app';
import { env } from './config/env';
import { startWorkers } from './config/queue';

const app = createApp();
startWorkers();

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on http://localhost:${env.PORT}`);
});
