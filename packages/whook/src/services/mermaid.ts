import { stdout as _stdout } from 'node:process';
import { type Knifecycle, autoService, location } from 'knifecycle';
import { ROUTES_WRAPPERS_REG_EXP } from './ROUTES_WRAPPERS.js';
import { CRONS_WRAPPERS_REG_EXP } from './CRONS_WRAPPERS.js';
import { type LogService } from 'common-services';
import {
  DEFAULT_CRONS_DEFINITIONS_OPTIONS,
  type WhookCronDefinitionsOptions,
} from './CRONS_DEFINITIONS.js';
import {
  DEFAULT_ROUTES_DEFINITIONS_OPTIONS,
  type WhookRoutesDefinitionsOptions,
} from './ROUTES_DEFINITIONS.js';

async function initMermaid({
  ROUTES_DEFINITIONS_OPTIONS = DEFAULT_ROUTES_DEFINITIONS_OPTIONS,
  CRONS_DEFINITIONS_OPTIONS = DEFAULT_CRONS_DEFINITIONS_OPTIONS,
  $ready,
  $instance,
  log,
  stdout,
}: {
  ROUTES_DEFINITIONS_OPTIONS?: WhookRoutesDefinitionsOptions;
  CRONS_DEFINITIONS_OPTIONS?: WhookCronDefinitionsOptions;
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
          pattern: ROUTES_WRAPPERS_REG_EXP,
          className: 'routes_wrappers',
        },
        ...ROUTES_DEFINITIONS_OPTIONS.serviceNamePatterns.map((pattern) => ({
          pattern: new RegExp(pattern),
          className: 'routes_handlers',
        })),
        {
          pattern: CRONS_WRAPPERS_REG_EXP,
          className: 'crons_wrappers',
        },
        ...CRONS_DEFINITIONS_OPTIONS.serviceNamePatterns.map((pattern) => ({
          pattern: new RegExp(pattern),
          className: 'crons_handlers',
        })),
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
        ...ROUTES_DEFINITIONS_OPTIONS.fileNamePatterns.map((pattern) => ({
          pattern: new RegExp(pattern),
          template: '$0(($0))',
        })),
        {
          pattern: ROUTES_WRAPPERS_REG_EXP,
          template: '$0($0)',
        },
        ...ROUTES_DEFINITIONS_OPTIONS.fileNamePatterns.map((pattern) => ({
          pattern: new RegExp(pattern),
          template: '$0[[$0]]',
        })),
        {
          pattern: ROUTES_WRAPPERS_REG_EXP,
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
