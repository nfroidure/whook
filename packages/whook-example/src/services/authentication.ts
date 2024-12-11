import { autoService, location } from 'knifecycle';
import { YError } from 'yerror';
import { type JWTService } from 'jwt-service';
import {
  type AuthenticationService,
  type BaseAuthenticationData,
} from '@whook/authorization';

export default location(autoService(initAuthentication), import.meta.url);

export type AuthenticationDependencies = {
  jwtToken: JWTService<AuthenticationData>;
};

export type AuthenticationData = BaseAuthenticationData & {
  userId: string;
};

type FakePayload = AuthenticationData;
type BearerPayload = { hash: string };

/* Architecture Note #4.1: authentication

A fake authentication service you can use as a base
 authentication service.
*/
async function initAuthentication({
  jwtToken,
}: AuthenticationDependencies): Promise<
  AuthenticationService<FakePayload | BearerPayload, AuthenticationData>
> {
  const authentication = {
    check: async (
      type: string,
      data: FakePayload | BearerPayload,
    ): Promise<AuthenticationData> => {
      if (type === 'fake') {
        return data as FakePayload;
      }
      if (type === 'bearer') {
        try {
          return await jwtToken.verify((data as BearerPayload).hash);
        } catch (err) {
          throw YError.wrap(
            err as Error,
            'E_BAD_BEARER_TOKEN',
            type,
            (data as BearerPayload).hash,
          );
        }
      }
      throw new YError('E_UNEXPECTED_AUTH_TYPE', type);
    },
  };

  return authentication;
}
