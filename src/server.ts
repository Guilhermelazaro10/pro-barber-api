import { env } from './config/env.js';
import { app } from './app.js';

app.listen(env.PORT, () => console.log(`ProBarber SaaS Online na porta ${env.PORT}`));
