import initJWT from 'jwt-service';
import { name } from 'knifecycle';
import type { JWTServiceInitializer } from 'jwt-service';
import type { AuthenticationData } from './authentication';

export default name(
  'jwtToken',
  initJWT,
) as JWTServiceInitializer<AuthenticationData>;
