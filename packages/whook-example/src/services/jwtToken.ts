import initJWT, { JWTServiceInitializer } from 'jwt-service';
import { name } from 'knifecycle';
import { AuthenticationData } from './authentication';

export default name('jwtToken', initJWT) as JWTServiceInitializer<
  AuthenticationData
>;
