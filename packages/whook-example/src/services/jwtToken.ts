import initJWT from 'jwt-service';
import {
  name,
  location,
  type ServiceInitializer,
  type Dependencies,
  type Service,
} from 'knifecycle';

/* Architecture Note #4.3: jwtToken

A JWT token issuer service. Here, we simply reuse
 an external project and rename it by the way.
*/
export default location(
  name(
    'jwtToken',
    initJWT as unknown as ServiceInitializer<Dependencies, Service>,
  ),
  import.meta.url,
) as unknown as typeof initJWT;
