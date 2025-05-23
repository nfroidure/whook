import { type WhookMain } from '../types/base.js';

export type WhookEnvironmentsConfig = 'all' | WhookMain['AppEnv'][] | undefined;

export function checkEnvironment(
  environments: WhookEnvironmentsConfig,
  currentEnvironment: WhookMain['AppEnv'],
) {
  return (
    typeof environments === 'undefined' ||
    'all' == environments ||
    environments.includes(currentEnvironment)
  );
}
