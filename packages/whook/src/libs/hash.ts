import { createHash as _createHash } from 'node:crypto';

export function createHash(data: Buffer, len: number): string {
  return _createHash('shake256', { outputLength: len })
    .update(data)
    .digest('hex');
}
