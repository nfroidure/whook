import { stdout as _stdout } from 'node:process';
import { type Knifecycle, autoService } from 'knifecycle';
import { WRAPPER_REG_EXP } from './WRAPPERS.js';
import { HANDLER_REG_EXP } from './HANDLERS.js';
import { type LogService } from 'common-services';

async function initMermaid({
  $ready,
  $instance,
  log,
  stdout,
}: {
  $ready: Promise<void>;
  $instance: Knifecycle;
  log: LogService;
  stdout: typeof _stdout;
}) {
  async function printGraph() {
    await $ready;

    const CONFIG_REG_EXP = /^([A-Z0-9_]+)$/;
    const MERMAID_GRAPH_CONFIG = {
      classes: {
        handlers: 'fill:#aad400,stroke:#000,stroke-width:1px,color:#000;',
        wrappers: 'fill:#aad400,stroke:#000,stroke-width:1px,color:#000;',
        config: 'fill:#000,stroke:#aad400,stroke-width:1px,color:#aad400;',
        others: 'fill:#aad400,stroke:#000,stroke-width:1px,color:#000;',
      },
      styles: [
        {
          pattern: WRAPPER_REG_EXP,
          className: 'wrappers',
        },
        {
          pattern: HANDLER_REG_EXP,
          className: 'handlers',
        },
        {
          pattern: CONFIG_REG_EXP,
          className: 'config',
        },
        {
          pattern: /^(.+)$/,
          className: 'others',
        },
      ],
      shapes: [
        {
          pattern: HANDLER_REG_EXP,
          template: '$0(($0))',
        },
        {
          pattern: WRAPPER_REG_EXP,
          template: '$0(($0))',
        },
        {
          pattern: CONFIG_REG_EXP,
          template: '$0{$0}',
        },
      ],
    };
    log('warning', '🌵 - Mermaid graph generated, shutting down now!');
    stdout.write($instance.toMermaidGraph(MERMAID_GRAPH_CONFIG));
    await $instance.destroy();
  }
  printGraph();
}

export default autoService(initMermaid);
