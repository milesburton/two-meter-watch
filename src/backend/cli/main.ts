import chalk from 'chalk';
import ora from 'ora';
import pino from 'pino';
import { startServer } from '../api/server.js';
import { env } from '../config/env.js';

const logger = pino({
  level: env.LOG_LEVEL,
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

async function commandServe(): Promise<void> {
  const server = await startServer(logger);

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'shutting down');
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

async function commandStatus(): Promise<void> {
  const spinner = ora('Checking two-meter-watch status...').start();
  try {
    const res = await fetch(`http://localhost:${env.PORT}/api/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const status = await res.json();
    spinner.succeed(chalk.green('two-meter-watch is running'));
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(status, null, 2));
  } catch (err) {
    spinner.fail(chalk.red('two-meter-watch is not reachable'));
    // eslint-disable-next-line no-console
    console.error(chalk.dim(String(err)));
    process.exitCode = 1;
  }
}

function commandScan(): void {
  // eslint-disable-next-line no-console
  console.log(chalk.yellow('scan: not yet implemented, see Phase 2'));
}

function printUsage(): void {
  // eslint-disable-next-line no-console
  console.log(`Usage: two-meter-watch <command>

Commands:
  serve     Start the capture + waterfall + API server
  status    Query a running server's /api/status endpoint
  scan      (Phase 2) Scan the band for active signals
`);
}

async function main(): Promise<void> {
  const [, , command] = process.argv;

  switch (command) {
    case 'serve':
      await commandServe();
      break;
    case 'status':
      await commandStatus();
      break;
    case 'scan':
      commandScan();
      break;
    default:
      printUsage();
      if (command !== undefined) process.exitCode = 1;
  }
}

main().catch((err) => {
  logger.error({ err }, 'fatal error');
  process.exitCode = 1;
});
