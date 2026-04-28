import { promises as fs } from 'node:fs';
import path from 'node:path';

import { assertManagedWritePath } from './path-guards.ts';
import { sanitizeFilesystemSegment } from './feature-identity.ts';

export async function acquireDeliveryMutationLock(payload: {
  command: string;
  featureCycleId: string;
  featureId: string;
  root: string;
}): Promise<() => Promise<void>> {
  const featureId = sanitizeFilesystemSegment(payload.featureId, 'delivery lock feature id');
  const featureCycleId = sanitizeFilesystemSegment(
    payload.featureCycleId,
    'delivery lock feature cycle id',
  );
  const locksDir = path.join(payload.root, '.dossier', 'ops', 'locks');
  const lockPath = path.join(locksDir, `${featureId}--${featureCycleId}.lock`);
  await assertManagedWritePath(payload.root, locksDir, lockPath, 'delivery mutation lock');

  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    handle = await fs.open(lockPath, 'wx');
    await handle.writeFile(
      `${JSON.stringify({
        command: payload.command,
        feature_cycle_id: featureCycleId,
        feature_id: featureId,
        pid: process.pid,
        started_at: new Date().toISOString(),
      })}\n`,
    );
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'EEXIST') {
      throw new Error(`Delivery mutation lock is already held for ${featureId}/${featureCycleId}.`);
    }
    throw error;
  }

  let released = false;
  return async () => {
    if (released) {
      return;
    }
    released = true;
    try {
      await handle?.close();
    } catch {
      // noop
    }
    await fs.rm(lockPath, { force: true });
  };
}

export async function acquireGlobalOperationLock(payload: {
  command: string;
  root: string;
}): Promise<() => Promise<void>> {
  const command = sanitizeFilesystemSegment(payload.command, 'global operation lock command');
  const locksDir = path.join(payload.root, '.dossier', 'ops', 'locks');
  const lockPath = path.join(locksDir, `${command}.lock`);
  await assertManagedWritePath(payload.root, locksDir, lockPath, 'global operation lock');

  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    handle = await fs.open(lockPath, 'wx');
    await handle.writeFile(
      `${JSON.stringify({
        command,
        pid: process.pid,
        started_at: new Date().toISOString(),
      })}\n`,
    );
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'EEXIST') {
      throw new Error(`Global operation lock is already held for ${command}.`);
    }
    throw error;
  }

  let released = false;
  return async () => {
    if (released) {
      return;
    }
    released = true;
    try {
      await handle?.close();
    } catch {
      // noop
    }
    await fs.rm(lockPath, { force: true });
  };
}
