import { stdout as _stdout } from 'node:process';
import { type Knifecycle, autoService, location } from 'knifecycle';
import { type LogService } from 'common-services';
import {
  ROUTE_WRAPPER_REG_EXP,
  ROUTE_DECLARATION_REG_EXP,
  CRON_WRAPPER_REG_EXP,
  CRON_DECLARATION_REG_EXP,
  TRANSFORMER_WRAPPER_REG_EXP,
  TRANSFORMER_DECLARATION_REG_EXP,
  CONSUMER_WRAPPER_REG_EXP,
  CONSUMER_DECLARATION_REG_EXP,
  COMMAND_WRAPPER_REG_EXP,
  COMMAND_DECLARATION_REG_EXP,
} from '@whook/whook';

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
        routes_handlers:
          'fill:#aad400,stroke:#000,stroke-width:1px,color:#000;',
        routes_wrappers:
          'fill:#aad400,stroke:#000,stroke-width:1px,color:#000;',
        crons_handlers: 'fill:#aad400,stroke:#000,stroke-width:1px,color:#000;',
        crons_wrappers: 'fill:#aad400,stroke:#000,stroke-width:1px,color:#000;',
        config: 'fill:#000,stroke:#aad400,stroke-width:1px,color:#aad400;',
        others: 'fill:#aad400,stroke:#000,stroke-width:1px,color:#000;',
      },
      styles: [
        {
          pattern: ROUTE_WRAPPER_REG_EXP,
          className: 'routes_wrappers',
        },
        {
          pattern: ROUTE_DECLARATION_REG_EXP,
          className: 'routes_handlers',
        },
        {
          pattern: CRON_WRAPPER_REG_EXP,
          className: 'crons_wrappers',
        },
        {
          pattern: CRON_DECLARATION_REG_EXP,
          className: 'crons_handlers',
        },
        {
          pattern: COMMAND_WRAPPER_REG_EXP,
          className: 'commands_wrappers',
        },
        {
          pattern: COMMAND_DECLARATION_REG_EXP,
          className: 'commands_handlers',
        },
        {
          pattern: CONSUMER_WRAPPER_REG_EXP,
          className: 'consumer_wrappers',
        },
        {
          pattern: CONSUMER_DECLARATION_REG_EXP,
          className: 'consumer_handlers',
        },
        {
          pattern: TRANSFORMER_WRAPPER_REG_EXP,
          className: 'transformers_wrappers',
        },
        {
          pattern: TRANSFORMER_DECLARATION_REG_EXP,
          className: 'transformers_handlers',
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
          pattern: new RegExp(ROUTE_DECLARATION_REG_EXP),
          template: '$0(($0))',
        },
        {
          pattern: ROUTE_WRAPPER_REG_EXP,
          template: '$0($0)',
        },
        {
          pattern: new RegExp(CRON_DECLARATION_REG_EXP),
          template: '$0[[$0]]',
        },
        {
          pattern: CRON_WRAPPER_REG_EXP,
          template: '$0[$0]',
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

export default location(autoService(initMermaid), import.meta.url);
