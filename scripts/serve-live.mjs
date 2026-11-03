#!/usr/bin/env node
/**
 * Keeps the ENVIS dashboard dev server alive.
 *
 * Starts Vite in-process, relays its output to the console and to `logs/live.log`,
 * and restarts it with a short backoff if it ever exits. Safe to run more than once:
 * if the port is already serving, it logs that and exits instead of starting a second copy.
 *
 * Used by `npm run live` and by the Windows logon task created by `scripts/live.ps1 -Action install`.
 */
import { spawn } from 'node:child_process';
import { appendFileSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { connect } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const logDir = join(root, 'logs');
mkdirSync(logDir, { recursive: true });
const logFile = join(logDir, 'live.log');

// Keep the log small: rotate once it passes 5 MB instead of growing forever.
try {
  if (statSync(logFile).size > 5 * 1024 * 1024) writeFileSync(logFile, '');
} catch {
  /* first run: no log yet */
}

const HOST = process.env.ENVIS_HOST || '127.0.0.1';
const PORT = Number(process.env.ENVIS_PORT || 5173);
const VITE_BIN = join(root, 'node_modules', 'vite', 'bin', 'vite.js');

let child = null;
let stopping = false;
let attempt = 0;
let startedAt = 0;

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  try {
    appendFileSync(logFile, `${line}\n`);
  } catch {
    /* logging must never take the server down */
  }
  console.log(line);
}

function portInUse(host, port, timeout = 700) {
  return new Promise((done) => {
    const socket = connect({ host, port });
    const finish = (result) => {
      socket.destroy();
      done(result);
    };
    socket.setTimeout(timeout);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

function start() {
  if (stopping) return;

  startedAt = Date.now();
  log(`starting vite  ->  http://${HOST}:${PORT}`);

  child = spawn(
    process.execPath,
    [VITE_BIN, '--host', HOST, '--port', String(PORT), '--strictPort'],
    { cwd: root, env: process.env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] },
  );

  const relay = (chunk) => {
    const text = chunk.toString();
    try {
      appendFileSync(logFile, text);
    } catch {
      /* ignore */
    }
    process.stdout.write(text);
  };
  child.stdout.on('data', relay);
  child.stderr.on('data', relay);

  child.on('error', (error) => {
    log(`failed to spawn vite: ${error.message}`);
  });

  child.on('exit', (code, signal) => {
    child = null;
    if (stopping) {
      log('supervisor stopped.');
      process.exit(0);
    }

    const uptime = Date.now() - startedAt;
    attempt = uptime > 60_000 ? 1 : attempt + 1;
    const delay = Math.min(1_000 * 2 ** Math.min(attempt, 4), 15_000);
    log(`vite exited (code=${code ?? '-'} signal=${signal ?? '-'}) after ${Math.round(uptime / 1000)}s; restarting in ${delay / 1000}s`);
    setTimeout(start, delay);
  });
}

function stop(signal) {
  if (stopping) return;
  stopping = true;
  log(`received ${signal}; shutting down vite.`);
  if (!child) process.exit(0);
  child.kill('SIGINT');
  setTimeout(() => {
    if (child) child.kill('SIGKILL');
    process.exit(0);
  }, 5_000).unref();
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) {
  process.on(signal, () => stop(signal));
}

const alreadyLive = await portInUse(HOST, PORT);
if (alreadyLive) {
  log(`port ${PORT} is already serving; nothing to do (http://${HOST}:${PORT}).`);
  process.exit(0);
}

log(`ENVIS dashboard supervisor online (pid ${process.pid}).`);
start();
