import { type WhookHandlerWrapper } from '../types/wrappers.js';

export async function applyHandlerWrappers<T>(
  wrappers: WhookHandlerWrapper<T>[],
  handler: T,
): Promise<T> {
  for (const wrapper of wrappers) {
    handler = await wrapper(handler);
  }

  return handler;
}
