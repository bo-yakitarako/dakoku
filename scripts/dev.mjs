import { spawn } from 'node:child_process';

const serverUrl = process.env.DEV_SERVER_URL ?? 'http://127.0.0.1:8080/';
const serverReadyTimeoutMs = Number(process.env.DEV_SERVER_READY_TIMEOUT_MS ?? 30000);
const serverPollIntervalMs = Number(process.env.DEV_SERVER_POLL_INTERVAL_MS ?? 500);

const runCommand = (label, command, args) => {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.error(`[${label}] exited with signal ${signal}`);
      return;
    }
    if (code && code !== 0) {
      console.error(`[${label}] exited with code ${code}`);
    }
  });

  child.on('error', (error) => {
    console.error(`[${label}] failed to start`, error);
  });

  return child;
};

const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const waitForExit = (child) => {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }
    child.once('exit', () => resolve());
  });
};

const killWindowsProcessTree = (pid) => {
  return new Promise((resolve) => {
    const killer = spawn('taskkill', ['/pid', String(pid), '/T', '/F'], {
      stdio: 'ignore',
      shell: true,
    });

    killer.once('error', () => resolve());
    killer.once('exit', () => resolve());
  });
};

const terminateChild = async (child) => {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  if (process.platform === 'win32') {
    await killWindowsProcessTree(child.pid);
    await waitForExit(child);
    return;
  }

  child.kill('SIGTERM');
  await waitForExit(child);
};

const isServerReady = async () => {
  try {
    const response = await fetch(serverUrl);
    return response.ok;
  } catch {
    return false;
  }
};

const waitForServer = async () => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < serverReadyTimeoutMs) {
    if (await isServerReady()) {
      return;
    }
    await delay(serverPollIntervalMs);
  }

  throw new Error(`Timed out waiting for server: ${serverUrl}`);
};

const children = new Set();
let shuttingDown = false;

const terminateChildren = async () => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  await Promise.allSettled([...children].map((child) => terminateChild(child)));
};

const handleSignal = async (signal) => {
  await terminateChildren();
  process.exitCode = signal === 'SIGINT' ? 130 : 143;
};

process.on('SIGINT', () => {
  void handleSignal('SIGINT');
});
process.on('SIGTERM', () => {
  void handleSignal('SIGTERM');
});

const main = async () => {
  const server = runCommand('server', 'pnpm', ['-C', 'server', 'dev']);
  children.add(server);

  server.once('exit', (code) => {
    children.delete(server);
    if (!shuttingDown && !children.size) {
      process.exit(code ?? 1);
      return;
    }
    void terminateChildren();
  });

  await waitForServer();
  console.log(`[dev] server is ready: ${serverUrl}`);

  const desktop = runCommand('desktop', 'pnpm', ['-C', 'desktop', 'dev']);
  children.add(desktop);

  desktop.once('exit', (code) => {
    children.delete(desktop);
    if (!shuttingDown) {
      void terminateChildren().finally(() => {
        process.exit(code ?? 0);
      });
    }
  });
};

void main().catch((error) => {
  console.error('[dev] failed to start', error);
  void terminateChildren().finally(() => {
    process.exit(1);
  });
});
