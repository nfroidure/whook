import { type Knifecycle, autoService, location } from 'knifecycle';
import { type LogService } from 'common-services';

async function initDryRun({
  $ready,
  $instance,
  log,
}: {
  $ready: Promise<void>;
  $instance: Knifecycle;
  log: LogService;
}) {
  async function doDryRun() {
    await $ready;
    log('warning', '🌵 - Dry run, shutting down now!');
    await $instance.destroy();
  }
  doDryRun();
}

export default location(autoService(initDryRun), import.meta.url);
