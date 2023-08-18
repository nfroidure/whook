import { printStackTrace } from 'yerror';
import { exit, stderr } from 'node:process';
import type { Knifecycle, Dependencies } from 'knifecycle';

export async function runREPL<
  D extends Dependencies,
  T extends Knifecycle = Knifecycle,
>(
  prepareEnvironment: ($?: T) => Promise<T>,
  injectedNames: string[] = [],
): Promise<D> {
  try {
    const $ = await prepareEnvironment();
    const services = await $.run([
      ...new Set(['repl', 'log', 'process', ...injectedNames]),
    ]);

    return { $instance: $, ...services } as unknown as D;
  } catch (err) {
    stderr.write(
      `💀 - Cannot launch the process: ${printStackTrace(err as Error)}`,
    );
    exit(1);
  }
}
