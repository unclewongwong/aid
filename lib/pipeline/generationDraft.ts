import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { diagnoseRepair, isRepairScopeBlocked, newRepairLedger, reserveRepair, resolveRepair, type RepairLedger } from '../repairCenter';

// Provider keys participate only in the hash; no credentials are written to a
// draft. Cache each bounded writing/directing batch, including invalid output.
export function generationDraft(kind: string, identity: unknown[]) {
  const root = process.env.AID_COMPANION_DATA_DIR;
  const key = createHash('sha256').update(JSON.stringify([kind, ...identity])).digest('hex');
  const file = root ? path.join(root, 'pipeline-drafts', `${key}.txt`) : undefined;
  return {
    async read(): Promise<string | undefined> {
      if (!file) return undefined;
      try { return await readFile(file, 'utf8'); }
      catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined; throw error; }
    },
    async save(raw: string): Promise<void> {
      if (!file) return;
      await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
      let previous: string | undefined;
      try { previous = await readFile(file, 'utf8'); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      if (previous !== undefined && previous !== raw) {
        const history = path.join(root!, 'pipeline-drafts-history', key);
        await mkdir(history, { recursive: true, mode: 0o700 });
        const revision = createHash('sha256').update(previous).digest('hex');
        try { await writeFile(path.join(history, `${revision}.txt`), previous, { flag: 'wx', mode: 0o600 }); }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
      }
      const temporary = `${file}.${randomUUID()}.tmp`;
      await writeFile(temporary, raw, { mode: 0o600 });
      await rename(temporary, file);
    },
    async readRepairs(): Promise<RepairLedger | undefined> {
      if (!file) return;
      try {
        const ledger = JSON.parse(await readFile(`${file}.repairs.json`, 'utf8'));
        if (ledger.version !== 1 || !ledger.budgets || !Array.isArray(ledger.events)) throw new Error('修复记录损坏，停止自动重试');
        return ledger;
      } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    },
    async saveRepairs(ledger: RepairLedger): Promise<void> {
      if (!file) return;
      await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
      const temporary = `${file}.${randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify(ledger), { mode: 0o600 });
      await rename(temporary, `${file}.repairs.json`);
    },
  };
}

export async function recoverGeneration<T>(input: {
  draft: Pick<ReturnType<typeof generationDraft>, 'read' | 'save'> & Partial<Pick<ReturnType<typeof generationDraft>, 'readRepairs' | 'saveRepairs'>>;
  parse: (raw: string) => T;
  generate: (previous: string | undefined, error: unknown, attempt: number) => Promise<string>;
  attempts: number;
  shouldRetry?: (error: unknown) => boolean;
}): Promise<T> {
  let raw = await input.draft.read();
  const ledger = await input.draft.readRepairs?.() || newRepairLedger();
  let lastError: unknown;
  let validation = false;
  const stopRejected = async (error: unknown) => {
    reserveRepair(ledger, 'writing', diagnoseRepair(error), { progress: raw, error });
    await input.draft.saveRepairs?.(ledger);
    throw error;
  };
  const accept = async (value: string) => {
    const result = input.parse(value);
    resolveRepair(ledger, 'writing');
    if (ledger.events.length) await input.draft.saveRepairs?.(ledger);
    return result;
  };
  if (raw) {
    try { return await accept(raw); }
    catch (error) {
      if (input.shouldRetry?.(error) === false) await stopRejected(error);
      lastError = error; validation = true;
    }
  }
  for (let attempt = 1; attempt <= input.attempts; attempt++) {
    if (isRepairScopeBlocked(ledger, 'writing')) {
      const stopped = ledger.events.findLast(event => event.scope === 'writing' && event.status === 'stopped');
      throw new Error(`修复中枢：${stopped?.reason || '该批次已停止自动修复，保留原稿'}`);
    }
    if (lastError) {
      const decision = diagnoseRepair(lastError, { validation });
      const reserved = reserveRepair(ledger, 'writing', decision, { limit: input.attempts, progress: raw, error: lastError });
      await input.draft.saveRepairs?.(ledger);
      if (!reserved.allowed) throw new Error(`修复中枢：${reserved.event.reason}。${lastError instanceof Error ? lastError.message : String(lastError)}`);
    }
    // Transport failures do not replace a retained draft with an error page.
    try {
      raw = await input.generate(raw, lastError, attempt);
    } catch (error) {
      if (input.shouldRetry?.(error) === false) await stopRejected(error);
      lastError = error;
      validation = error instanceof Error && /DirectorFieldRepairError|ScriptStructureError|ScriptDialogueError/.test(error.name);
      continue;
    }
    await input.draft.save(raw);
    try { return await accept(raw); }
    catch (error) {
      if (input.shouldRetry?.(error) === false) await stopRejected(error);
      lastError = error; validation = true;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('生成未通过校验');
}
