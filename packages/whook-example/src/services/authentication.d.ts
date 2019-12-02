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
export declare type AuthenticationConfig = {
  TOKEN: string;
};
declare function initAuthentication({
  TOKEN,
}: AuthenticationConfig): Promise<
  AuthenticationService<FakePayload | BearerPayload, AuthenticationPayload>
>;
