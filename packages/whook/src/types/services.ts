import { type Service } from 'knifecycle';

export type WhookBaseServices = Record<string, Service>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WhookServices extends WhookBaseServices {}
