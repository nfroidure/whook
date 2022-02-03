declare namespace API {
  export namespace GetDelay {
    export type Output = Responses.$204;
    export type Input = {
      readonly duration: Parameters.Duration;
    };
    export namespace Responses {
      export type $204 = Components.Responses.getDelayResponse204<204>;
    }
    export namespace Parameters {
      export type Duration = Components.Parameters.Duration;
    }
  }
  export namespace GetDiagnostic {
    export type Output = Responses.$200;
    export type Input = {};
    export namespace Responses {
      export type $200 = Components.Responses.Diagnostic<200>;
    }
  }
  export namespace GetOpenAPI {
    export type Output = Responses.$200;
    export type Input = {};
    export namespace Responses {
      export type $200 = Components.Responses.getOpenAPIResponse200<200>;
    }
  }
  export namespace GetParameters {
    export type Output = Responses.$200;
    export type Input = {
      readonly aHeader?: Parameters.AHeader;
      readonly pathParam1: Parameters.PathParam1;
      readonly pathParam2: Parameters.PathParam2;
    };
    export namespace Responses {
      export type $200 = Components.Responses.getParametersResponse200<200>;
    }
    export namespace Parameters {
      export type AHeader = Components.Parameters.GetParameters2;
      export type PathParam1 = Components.Parameters.PathParam1;
      export type PathParam2 = Components.Parameters.PathParam2;
    }
  }
  export namespace GetTime {
    export type Output = Responses.$200;
    export type Input = {};
    export namespace Responses {
      export type $200 = Components.Responses.getTimeResponse200<200>;
    }
  }
  export namespace PutEcho {
    export type Body = Components.RequestBodies.Echo;
    export type Output = Responses.$200;
    export type Input = {
      readonly body: Body;
    };
    export namespace Responses {
      export type $200 = Components.Responses.Echo<200>;
    }
  }
  export namespace GetPing {
    export type Output = Responses.$200;
    export type Input = {};
    export namespace Responses {
      export type $200 = Components.Responses.getPingResponse200<200>;
    }
  }
}
declare namespace Components {
  export namespace RequestBodies {
    export type Echo = Components.Schemas.Echo;
  }
  export namespace Parameters {
    export type Duration = NonNullable<number>;
    export type PathParam1 = NonNullable<number>;
    export type GetParameters2 = NonNullable<boolean>;
    export type PathParam2 = NonNullable<NonNullable<string>[]>;
  }
  export namespace Responses {
    type getDelayResponse204<S extends number> = {
      readonly status: S;
      readonly headers?: {
        readonly [name: string]: unknown;
      };
      readonly body?: NonNullable<unknown>;
    };
    type Diagnostic<S extends number> = {
      readonly status: S;
      readonly headers?: {
        readonly [name: string]: unknown;
      };
      readonly body: Components.Schemas.ResponsesDiagnosticBody0;
    };
    type Echo<S extends number> = {
      readonly status: S;
      readonly headers?: {
        readonly [name: string]: unknown;
      };
      readonly body: Components.Schemas.Echo;
    };
    type getOpenAPIResponse200<S extends number> = {
      readonly status: S;
      readonly headers?: {
        readonly [name: string]: unknown;
      };
      readonly body: Components.Schemas.ResponsesgetOpenAPIResponse200Body0;
    };
    type getParametersResponse200<S extends number> = {
      readonly status: S;
      readonly headers?: {
        readonly [name: string]: unknown;
      };
      readonly body: Components.Schemas.ResponsesgetParametersResponse200Body0;
    };
    type getTimeResponse200<S extends number> = {
      readonly status: S;
      readonly headers?: {
        readonly [name: string]: unknown;
      };
      readonly body: Components.Schemas.TimeSchema;
    };
    type getPingResponse200<S extends number> = {
      readonly status: S;
      readonly headers?: {
        readonly [name: string]: unknown;
      };
      readonly body: Components.Schemas.ResponsesgetPingResponse200Body0;
    };
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
    export type ResponsesDiagnosticBody0 = NonNullable<{
      transactions: NonNullable<{
        [pattern: string]: unknown;
      }>;
    }>;
    export type ResponsesgetOpenAPIResponse200Body0 = NonNullable<{}>;
    export type ResponsesgetParametersResponse200Body0 = NonNullable<{
      aHeader?: NonNullable<boolean>;
      pathParam1?: NonNullable<number>;
      pathParam2?: NonNullable<NonNullable<string>[]>;
    }>;
    export type ResponsesgetPingResponse200Body0 = NonNullable<{
      pong?: 'pong';
    }>;
  }
}
