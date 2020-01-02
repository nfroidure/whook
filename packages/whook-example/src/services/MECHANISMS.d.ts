export declare const FAKE_MECHANISM: {
  type: string;
  parseAuthorizationRest: (
    rest: any,
  ) => {
    hash: any;
    userId: any;
    scopes: any;
  };
};
declare const _default: typeof initMechanisms;
export default _default;
declare function initMechanisms({
  ENV,
  log,
}: {
  ENV: any;
  log: any;
}): Promise<
  {
    type: string;
  }[]
>;
