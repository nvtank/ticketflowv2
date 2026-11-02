import { createApplication } from './app';
import { parseEnvironment } from './config';

async function main() {
  const environment = parseEnvironment(process.env);
  const app = await createApplication(environment);
  await app.listen(environment.PORT, '0.0.0.0');
}

void main().catch(() => {
  // Do not print library errors that may contain database credentials.
  console.error('API startup failed; verify environment and dependency availability');
  process.exitCode = 1;
});
