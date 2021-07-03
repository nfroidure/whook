import initJWT from 'jwt-service';
import { name } from 'knifecycle';
import type { JWTServiceInitializer } from 'jwt-service';
import type { AuthenticationData } from './authentication';

/* Architecture Note #4.3: jwtToken

A JWT token issuer service. Here, we simply reuse
 an external project and rename it by the way.
*/
export default name(
  'jwtToken',
  initJWT,
) as JWTServiceInitializer<AuthenticationData>;
