declare namespace API {
    export namespace GetDelay {
        export type Input = {
            readonly duration: Parameters.Duration;
        };
        export type Output = any;
        export namespace Parameters {
            export type Duration = Components.Schemas.ApiParameters.Duration;
        }
    }
    export namespace GetDiagnostic {
        export type Input = {};
        export type Output = {
            readonly status: 200;
            readonly headers?: NonNullable<{
                [pattern: string]: (NonNullable<string> | NonNullable<NonNullable<string>[]>);
            }>;
            readonly body: Responses.$200;
        };
        export namespace Responses {
            export type $200 = Components.Schemas.ApiResponses.GetDiagnostic.Response200.Schema0;
        }
    }
    export namespace GetOpenAPI {
        export type Input = {};
        export type Output = {
            readonly status: 200;
            readonly headers?: NonNullable<{
                [pattern: string]: (NonNullable<string> | NonNullable<NonNullable<string>[]>);
            }>;
            readonly body: Responses.$200;
        };
        export namespace Responses {
            export type $200 = Components.Schemas.ApiResponses.GetOpenAPI.Response200.Schema0;
        }
    }
    export namespace GetParameters {
        export type Input = {
            readonly aHeader?: Parameters.AHeader;
            readonly pathParam1: Parameters.PathParam1;
            readonly pathParam2: Parameters.PathParam2;
        };
        export type Output = {
            readonly status: 200;
            readonly headers?: NonNullable<{
                [pattern: string]: (NonNullable<string> | NonNullable<NonNullable<string>[]>);
            }>;
            readonly body: Responses.$200;
        };
        export namespace Responses {
            export type $200 = Components.Schemas.ApiResponses.GetParameters.Response200.Schema0;
        }
        export namespace Parameters {
            export type PathParam1 = Components.Schemas.ApiParameters.PathParam1;
            export type PathParam2 = Components.Schemas.ApiParameters.PathParam2;
            export type AHeader = NonNullable<boolean>;
        }
    }
    export namespace GetTime {
        export type Input = {};
        export type Output = {
            readonly status: 200;
            readonly headers?: NonNullable<{
                [pattern: string]: (NonNullable<string> | NonNullable<NonNullable<string>[]>);
            }>;
            readonly body: Responses.$200;
        };
        export namespace Responses {
            export type $200 = Components.Schemas.ApiResponses.GetTime.Response200.Schema0;
        }
    }
    export namespace PutEcho {
        export type Body = Components.Schemas.ApiRequestBodies.PutEcho.Body0;
        export type Input = {
            readonly body: Body;
        };
        export type Output = {
            readonly status: 200;
            readonly headers?: NonNullable<{
                [pattern: string]: (NonNullable<string> | NonNullable<NonNullable<string>[]>);
            }>;
            readonly body: Responses.$200;
        };
        export namespace Responses {
            export type $200 = Components.Schemas.ApiResponses.PutEcho.Response200.Schema0;
        }
    }
    export namespace GetPing {
        export type Input = {};
        export type Output = {
            readonly status: 200;
            readonly headers?: NonNullable<{
                [pattern: string]: (NonNullable<string> | NonNullable<NonNullable<string>[]>);
            }>;
            readonly body: Responses.$200;
        };
        export namespace Responses {
            export type $200 = Components.Schemas.ApiResponses.GetPing.Response200.Schema0;
        }
    }
}
declare namespace Components {
    export namespace Schemas {
        export type TimeSchema = NonNullable<{
            currentDate?: NonNullable<string>;
        }>;
        export type Echo = NonNullable<{
            echo: NonNullable<string>;
        }>;
        export namespace ApiParameters {
            export type Duration = NonNullable<number>;
            export type PathParam1 = NonNullable<number>;
            export type PathParam2 = NonNullable<NonNullable<string>[]>;
        }
        export namespace ApiResponses {
            export namespace GetDiagnostic {
                export namespace Response200 {
                    export type Schema0 = NonNullable<{
                        transactions: NonNullable<{
                            [pattern: string]: any;
                        }>;
                    }>;
                }
            }
            export namespace GetOpenAPI {
                export namespace Response200 {
                    export type Schema0 = NonNullable<{}>;
                }
            }
            export namespace GetParameters {
                export namespace Response200 {
                    export type Schema0 = NonNullable<{
                        aHeader?: NonNullable<boolean>;
                        pathParam1?: NonNullable<number>;
                        pathParam2?: NonNullable<NonNullable<string>[]>;
                    }>;
                }
            }
            export namespace GetTime {
                export namespace Response200 {
                    export type Schema0 = Components.Schemas.TimeSchema;
                }
            }
            export namespace PutEcho {
                export namespace Response200 {
                    export type Schema0 = Components.Schemas.Echo;
                }
            }
            export namespace GetPing {
                export namespace Response200 {
                    export type Schema0 = NonNullable<{
                        pong?: "pong";
                    }>;
                }
            }
        }
        export namespace ApiRequestBodies {
            export namespace PutEcho {
                export type Body0 = Components.Schemas.Echo;
            }
        }
    }
}