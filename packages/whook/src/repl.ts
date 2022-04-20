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
    // eslint-disable-next-line
    console.error('💀 - Cannot launch the process:', (err as Error).stack);
    process.exit(1);
  }
}
