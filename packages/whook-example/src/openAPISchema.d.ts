// This file is autogenerated by Whook
// Do not try to change it in place
/* eslint-disable @typescript-eslint/ban-types */
declare interface paths {
  '/delay': {
    get: operations['getDelay'];
  };
  '/diagnostic': {
    get: operations['getDiagnostic'];
  };
  '/graphql': {
    get: operations['getGraphQL'];
    post: operations['postGraphQL'];
  };
  '/openAPI': {
    get: operations['getOpenAPI'];
  };
  '/{pathParam1}/{pathParam2}': {
    get: operations['getParameters'];
  };
  '/time': {
    get: operations['getTime'];
    put: operations['putTime'];
  };
  '/echo': {
    put: operations['putEcho'];
  };
  '/ping': {
    get: operations['getPing'];
  };
}
declare interface operations {
  postDelayCallback: {
    responses: {
      204: object;
    };
    parameters: {
      query: {
        duration: components['parameters']['duration'];
      };
    };
  };
  getDelay: {
    callbacks: {
      DelayCallback: components['callbacks']['DelayCallback'];
    };
    responses: {
      204: object;
    };
    parameters: {
      query: {
        duration: components['parameters']['duration'];
        callbackUrl?: string;
      };
    };
  };
  getDiagnostic: {
    responses: {
      200: components['responses']['Diagnostic'];
    };
  };
  getGraphQL: {
    responses: {
      200: {
        body: {
          [pattern: string]: unknown;
        };
      };
    };
    parameters: {
      query: {
        query: string;
        variables?: string;
        operationName?: string;
      };
    };
  };
  postGraphQL: {
    requestBody?: {
      query?: string;
      [pattern: string]: unknown;
    };
    responses: {
      200: {
        body: {
          [pattern: string]: unknown;
        };
      };
    };
  };
  getOpenAPI: {
    responses: {
      200: {
        body: object;
      };
    };
  };
  getParameters: {
    responses: {
      200: {
        body: {
          aHeader?: boolean;
          aMultiHeader?: number[];
          pathParam1?: number;
          pathParam2?: string;
          queryParam?: string[];
        };
      };
    };
    parameters: {
      path: {
        pathParam1: components['parameters']['pathParam1'];
        pathParam2: components['parameters']['pathParam2'];
      };
      query: {
        queryParam: components['parameters']['queryParam'];
      };
      header: {
        'a-header'?: boolean;
        aMultiHeader?: number[];
      };
    };
  };
  getTime: {
    responses: {
      200: {
        body: components['schemas']['TimeSchema'];
      };
    };
  };
  putTime: {
    requestBody: {
      time: number;
      isFixed?: boolean;
    };
    responses: {
      201: {
        body: number;
      };
    };
  };
  putEcho: {
    requestBody: components['requestBodies']['Echo'];
    responses: {
      200: components['responses']['Echo'];
    };
  };
  getPing: {
    responses: {
      200: {
        body: {
          pong?: 'pong';
        };
      };
    };
  };
}
declare interface components {
  callbacks: {
    DelayCallback: {
      '{$request.query.callbackUrl}': {
        post: operations['postDelayCallback'];
      };
    };
  };
  parameters: {
    duration: number;
    pathParam1: number;
    pathParam2: string;
    queryParam: string[];
  };
  responses: {
    Diagnostic: {
      body: {
        transactions: {
          [pattern: string]: unknown;
        };
      };
    };
    Echo: {
      body: components['schemas']['Echo'];
    };
  };
  requestBodies: {
    Echo: components['schemas']['Echo'];
  };
  schemas: {
    TimeSchema: {
      currentDate?: string;
    };
    Echo: {
      echo: string;
    };
    ExampleSchema: {
      message?: string;
      delay?: number;
    };
  };
}
