import { LogService, noop } from 'common-services';
import { type WhookDefinitions } from '../services/DEFINITIONS.js';
import {
  type WhookHandlerWrapperDefinition,
  type WhookHandlerWrapper,
} from '../types/wrappers.js';

export function filterWrappers(
  {
    DEFINITIONS,
  }: {
    DEFINITIONS: WhookDefinitions;
  },
  type: WhookHandlerWrapperDefinition['type'],
) {
  return Object.keys(DEFINITIONS.wrappers).filter((wrapperName) => {
    const definition = DEFINITIONS.wrappers[wrapperName]?.definition;

    if (
      definition?.type !== type ||
      !definition.config?.targets ||
      definition.config.targets === 'none'
    ) {
      return false;
    }
    return true;
  });
}

export function filterHandlerWrappers(
  {
    DEFINITIONS,
    log = noop,
  }: {
    DEFINITIONS: WhookDefinitions;
    log?: LogService;
  },
  availableWrappers: string[],
  type: WhookHandlerWrapperDefinition['type'],
  handlerName: string,
) {
  return availableWrappers.filter((wrapperName) => {
    const definition = DEFINITIONS.wrappers[wrapperName]?.definition;

    if (!definition) {
      log(
        'warning',
        `🤷 - No definition found for "${wrapperName}" ${type} handler wrapper.`,
      );
      return false;
    }

    const config = definition.type === type ? definition.config : undefined;

    if (
      typeof config === 'undefined' ||
      !config.targets ||
      config.targets === 'none'
    ) {
      return false;
    }

    if (config.targets === 'all') {
      return true;
    }

    if (config.targets === 'select') {
      return (
        DEFINITIONS.configs[handlerName]?.type === type &&
        DEFINITIONS.configs[handlerName].config?.wrappers?.includes(wrapperName)
      );
    }

    return config.targets.includes(handlerName);
  });
}

export async function applyHandlerWrappers<T>(
  wrappers: WhookHandlerWrapper<T>[],
  handler: T,
): Promise<T> {
  for (const wrapper of wrappers) {
    handler = await wrapper(handler);
  }

  return handler;
}
