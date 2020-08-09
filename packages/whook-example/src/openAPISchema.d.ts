declare namespace Components {
    namespace Parameters {
        namespace Duration {
            export type Duration = number;
        }
        namespace PathParam1 {
            export type PathParam1 = number;
        }
        namespace PathParam2 {
            export type PathParam2 = string[];
        }
    }
    namespace Schemas {
        export interface Echo {
            echo: string;
        }
        export interface TimeSchema {
            currentDate?: string; // date-time
        }
    }
}
declare namespace Paths {
    namespace GetDelay {
        namespace Responses {
            export interface $204 {
            }
        }
    }
    namespace GetDiagnostic {
        namespace Responses {
            export interface $200 {
                transactions: {
                    [name: string]: any;
                };
            }
        }
    }
    namespace GetOpenAPI {
        namespace Responses {
            export interface $200 {
            }
        }
    }
    namespace GetParameters {
        export interface HeaderParameters {
            aHeader?: Parameters.AHeader;
        }
        namespace Parameters {
            export type AHeader = boolean;
        }
        namespace Responses {
            export interface $204 {
                aHeader?: boolean;
                pathParam1?: number;
                pathParam2?: string[];
            }
        }
    }
    namespace GetPing {
        namespace Responses {
            export interface $200 {
                pong?: "pong";
            }
        }
    }
    namespace GetTime {
        namespace Responses {
            export type $200 = Components.Schemas.TimeSchema;
        }
    }
    namespace PutEcho {
        export type RequestBody = Components.Schemas.Echo;
        namespace Responses {
            export type $200 = Components.Schemas.Echo;
        }
    }
}
