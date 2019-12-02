declare const _default: typeof initCommand;
export default _default;
declare function initCommand({
  commandHandler,
  log,
}: {
  commandHandler: any;
  log: any;
}): Promise<() => Promise<void>>;
