import { AuthenticationService } from '@whook/authorization';
declare const _default: typeof initAuthentication;
export default _default;
declare type FakePayload = AuthenticationPayload;
declare type BearerPayload = {
  hash: string;
};
declare type AuthenticationPayload = {
  userId: number;
  scopes: string[];
};
declare function initAuthentication({
  TOKEN,
}: {
  TOKEN: string;
}): Promise<
  AuthenticationService<FakePayload | BearerPayload, AuthenticationPayload>
>;
