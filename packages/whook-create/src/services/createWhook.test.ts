/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import initCreateWhook from './createWhook.js';
import { YError } from 'yerror';
import { readFileSync } from 'fs';
import type { LogService } from 'common-services';
import type { PathLike } from 'fs-extra';

const _packageJSON = JSON.parse(
  readFileSync('../whook-example/package.json').toString(),
);
const FILE_CONTENTS = {
  'README.md': `
# test
> yolo

[//]: # (::contents:start)

YOLO

[//]: # (::contents:end)

# Authors
Mr Bean
`,
  'watch.ts': `
the watch.ts file contents
 with'../../' replaced so
 equal to './'!
`,
};

describe('initCreateWhook', () => {
  const CWD = '/home/whoiam/projects/';
  const SOURCE_DIR = '/var/lib/node/node_modules/whook-example';
  const packageJSON = {
    ..._packageJSON,
    dependencies: {
      ..._packageJSON.dependencies,
      '@whook/authorization': '<current_version>',
      '@whook/cors': '<current_version>',
      '@whook/http-router': '<current_version>',
      '@whook/http-server': '<current_version>',
      '@whook/http-transaction': '<current_version>',
      '@whook/swagger-ui': '<current_version>',
      '@whook/whook': '<current_version>',
    },
  };
  const author = {
    name: 'Wayne Campbell',
    email: 'wayne@warner.com',
  };
  const project = {
    name: 'super-project',
    directory: '/home/whoiam/projects/yolo',
  };
  const outputFile = jest.fn<(file: PathLike, data: Buffer) => Promise<void>>();
  const readFile = jest.fn<(file: PathLike) => Promise<Buffer>>();
  const readdir = jest.fn<(file: PathLike) => Promise<string[]>>();
  const exec = jest.fn<any>();
  const axios = jest.fn<any>();
  const ora = jest.fn<any>();
  const copy = jest.fn<any>();
  const oraInstance = {
    start: jest.fn<any>(),
    stopAndPersist: jest.fn<any>(),
  };
  const log = jest.fn<LogService>();

  beforeEach(() => {
    axios.mockReset();
    outputFile.mockReset();
    readFile.mockReset();
    readdir.mockReset();
    exec.mockReset();
    copy.mockReset();
    log.mockReset();
    ora.mockReset();
    ora.mockReturnValue(oraInstance);
    oraInstance.start.mockReset();
    oraInstance.start.mockReturnValue(oraInstance);
    oraInstance.stopAndPersist.mockReset();
    readFile.mockImplementation(async (file) => {
      if (file.toString().endsWith('package.json')) {
        return Buffer.from(JSON.stringify(packageJSON));
      }
      const key = Object.keys(FILE_CONTENTS).find((key) =>
        file.toString().endsWith(key),
      );

      if (key) {
        return Buffer.from(FILE_CONTENTS[key]);
      }
      return Buffer.from('NO_FILE_CONTENTS');
    });
  });

  it('should work', async () => {
    readdir.mockResolvedValueOnce(['local', 'production']);
    copy.mockImplementationOnce((_, _2, { filter }) =>
      Promise.all(
        [
          'package.json',
          'package-lock.json',
          'LICENSE',
          'dist/index.js',
          'src/index.js',
          'coverage/index.html',
          'node_modules/whook/index.js',
        ].map((fileName) =>
          filter(
            `${SOURCE_DIR}/${fileName}`,
            `${project.directory}/${fileName}`,
          ),
        ),
      ),
    );
    axios.mockResolvedValueOnce({
      data: 'node_modules',
    });
    outputFile.mockResolvedValueOnce(undefined);
    outputFile.mockResolvedValueOnce(undefined);
    outputFile.mockResolvedValueOnce(undefined);
    exec.mockImplementationOnce((_, _2, cb) =>
      cb(null, 'Initialized an empty git repository!'),
    );
    exec.mockImplementationOnce((_, _2, cb) =>
      cb(null, 'Installed dependencies!'),
    );

    const createWhook = await initCreateWhook({
      CWD,
      SOURCE_DIR,
      author,
      project,
      outputFile: outputFile as any,
      readFile: readFile as any,
      readdir: readdir as any,
      exec: exec as any,
      copy,
      axios: axios as any,
      ora: ora as any,
      log,
    });

    await createWhook();

    expect(
      JSON.parse(
        outputFile.mock.calls
          .find((call) => call[0].toString().endsWith('package.json'))?.[1]
          ?.toString() || '',
      ),
    ).toMatchInlineSnapshot(`
{
  "author": {
    "email": "wayne@warner.com",
    "name": "Wayne Campbell",
  },
  "dependencies": {
    "@apidevtools/swagger-parser": "^10.1.0",
    "@whook/authorization": "<current_version>",
    "@whook/cors": "<current_version>",
    "@whook/http-router": "<current_version>",
    "@whook/http-server": "<current_version>",
    "@whook/http-transaction": "<current_version>",
    "@whook/swagger-ui": "<current_version>",
    "@whook/whook": "<current_version>",
    "application-services": "^6.1.0",
    "common-services": "^16.0.4",
    "http-auth-utils": "^6.0.1",
    "jwt-service": "^10.1.1",
    "knifecycle": "^17.2.1",
    "openapi-types": "^12.1.3",
    "pkg-dir": "^8.0.0",
    "strict-qs": "^8.0.3",
    "type-fest": "^4.26.1",
    "yerror": "^8.0.0",
    "yhttperror": "^8.0.0",
  },
  "description": "A new Whook project",
  "devDependencies": {
    "@eslint/js": "^9.7.0",
    "@mermaid-js/mermaid-cli": "^11.4.0",
    "@swc/cli": "^0.4.0",
    "@swc/core": "^1.6.13",
    "@swc/helpers": "^0.5.12",
    "@swc/jest": "^0.2.36",
    "axios": "^1.7.7",
    "chokidar": "^3.5.3",
    "esbuild-node-externals": "^1.13.1",
    "eslint": "^9.7.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-jest": "^28.6.0",
    "eslint-plugin-prettier": "^5.1.3",
    "jest": "^29.7.0",
    "jsarch": "^6.0.3",
    "mermaid": "^11.4.1",
    "prettier": "^3.3.3",
    "rimraf": "^6.0.1",
    "schema2dts": "^7.0.2",
    "tsx": "^4.7.1",
    "typescript": "^5.5.3",
    "typescript-eslint": "^7.16.0",
  },
  "engines": {
    "node": ">=20.11.1",
  },
  "files": [
    "bin",
    "dist",
    "src",
    "LICENSE",
    "README.md",
    "CHANGELOG.md",
  ],
  "jest": {
    "coverageReporters": [
      "lcov",
      "html",
    ],
    "extensionsToTreatAsEsm": [
      ".ts",
    ],
    "moduleNameMapper": {
      "#(.*)": "<rootDir>/../../node_modules/$1",
      "(.+)\\.js": "$1",
    },
    "prettierPath": null,
    "roots": [
      "<rootDir>/src",
    ],
    "testEnvironment": "node",
    "testPathIgnorePatterns": [
      "/node_modules/",
    ],
    "transform": {
      "^.+\\.tsx?$": [
        "@swc/jest",
        {},
      ],
    },
  },
  "keywords": [
    "whook",
  ],
  "license": "SEE LICENSE",
  "main": "dist/index.js",
  "name": "super-project",
  "overrides": {
    "eslint": "^9.7.0",
  },
  "prettier": {
    "printWidth": 80,
    "proseWrap": "always",
    "semi": true,
    "singleQuote": true,
    "trailingComma": "all",
  },
  "private": true,
  "scripts": {
    "apitypes": "npm run --silent whook -- generateOpenAPISchema --authenticated=true | npm run --silent whook -- generateOpenAPITypes > src/openAPISchema.d.ts",
    "architecture": "jsarch 'src/**/*.ts' > ARCHITECTURE.md && git add ARCHITECTURE.md",
    "build": "rimraf 'dist' && tsc --outDir dist",
    "cover": "npm run jest -- --coverage",
    "debug": "NODE_OPTIONS=\${NODE_OPTIONS:-'--inspect'} NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 DEBUG=\${DEBUG:-whook} tsx bin/dev",
    "dev": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 tsx bin/dev.js",
    "format": "npm run prettier",
    "graph": "npm run graph:build && npm run graph:generate && git add DEPENDENCIES.mmd*",
    "graph:build": "MERMAID_RUN=1 npm run --silent dev > DEPENDENCIES.mmd",
    "graph:generate": "mmdc -i DEPENDENCIES.mmd -o DEPENDENCIES.mmd.svg",
    "jest": "NODE_OPTIONS=--experimental-vm-modules NODE_ENV=test jest",
    "lint": "eslint 'src/**/*.ts'",
    "postbuild": "NODE_ENV=\${NODE_ENV:-development} tsx bin/build.js",
    "prettier": "prettier --write 'src/**/*.ts'",
    "rebuild": "swc ./src -s -d dist -C jsc.target=es2022",
    "repl": "NODE_ENV=\${NODE_ENV:-development} tsx bin/repl.js",
    "start": "NODE_ENV=\${NODE_ENV:-development} node bin/start.js",
    "test": "NODE_ENV=test npm run build && npm run jest",
    "type-check": "tsc --pretty --noEmit",
    "watch": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 tsx bin/watch.js",
    "whook": "NODE_ENV=\${NODE_ENV:-development} whook",
    "whook-debug": "NODE_OPTIONS=\${NODE_OPTIONS:-'--inspect'} NODE_ENV=\${NODE_ENV:-development} DEBUG=\${DEBUG:-whook} tsx bin/whook.js",
    "whook-dev": "NODE_ENV=\${NODE_ENV:-development} tsx bin/whook.js",
  },
  "type": "module",
  "types": "dist/index.d.ts",
  "version": "0.0.0",
}
`);
    expect({
      copyCalls: copy.mock.calls,
      outputFileCalls: outputFile.mock.calls,
      readFileCalls: readFile.mock.calls,
      execCalls: exec.mock.calls,
      oraCalls: ora.mock.calls,
      oraStartCalls: oraInstance.start.mock.calls,
      oraStopAndPersistCalls: oraInstance.stopAndPersist.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      readdirCalls: readFile.mock.calls,
    }).toMatchSnapshot();
  });

  it('should handle network issues', async () => {
    readdir.mockResolvedValueOnce(['local', 'production']);
    copy.mockImplementationOnce((_, _2, { filter }) =>
      Promise.all(
        [
          'package.json',
          'package-lock.json',
          'LICENSE',
          'dist/index.js',
          'src/index.js',
          'coverage/index.html',
          'node_modules/whook/index.js',
        ].map((fileName) =>
          filter(
            `${SOURCE_DIR}/${fileName}`,
            `${project.directory}/${fileName}`,
          ),
        ),
      ),
    );
    axios.mockRejectedValueOnce(new YError('E_NETWORK'));
    outputFile.mockResolvedValueOnce(undefined);
    outputFile.mockResolvedValueOnce(undefined);
    outputFile.mockResolvedValueOnce(undefined);
    exec.mockImplementationOnce((_, _2, cb) => cb(new YError('E_ACCESS')));
    exec.mockImplementationOnce((_, _2, cb) =>
      cb(null, 'Installed dependencies!'),
    );

    const createWhook = await initCreateWhook({
      CWD,
      SOURCE_DIR,
      author,
      project,
      outputFile: outputFile as any,
      readFile: readFile as any,
      readdir: readdir as any,
      exec: exec as any,
      copy,
      axios: axios as any,
      ora: ora as any,
      log,
    });

    await createWhook();

    expect(
      JSON.parse(
        outputFile.mock.calls
          .find((call) => call[0].toString().endsWith('package.json'))?.[1]
          ?.toString() || '',
      ),
    ).toMatchInlineSnapshot(`
{
  "author": {
    "email": "wayne@warner.com",
    "name": "Wayne Campbell",
  },
  "dependencies": {
    "@apidevtools/swagger-parser": "^10.1.0",
    "@whook/authorization": "<current_version>",
    "@whook/cors": "<current_version>",
    "@whook/http-router": "<current_version>",
    "@whook/http-server": "<current_version>",
    "@whook/http-transaction": "<current_version>",
    "@whook/swagger-ui": "<current_version>",
    "@whook/whook": "<current_version>",
    "application-services": "^6.1.0",
    "common-services": "^16.0.4",
    "http-auth-utils": "^6.0.1",
    "jwt-service": "^10.1.1",
    "knifecycle": "^17.2.1",
    "openapi-types": "^12.1.3",
    "pkg-dir": "^8.0.0",
    "strict-qs": "^8.0.3",
    "type-fest": "^4.26.1",
    "yerror": "^8.0.0",
    "yhttperror": "^8.0.0",
  },
  "description": "A new Whook project",
  "devDependencies": {
    "@eslint/js": "^9.7.0",
    "@mermaid-js/mermaid-cli": "^11.4.0",
    "@swc/cli": "^0.4.0",
    "@swc/core": "^1.6.13",
    "@swc/helpers": "^0.5.12",
    "@swc/jest": "^0.2.36",
    "axios": "^1.7.7",
    "chokidar": "^3.5.3",
    "esbuild-node-externals": "^1.13.1",
    "eslint": "^9.7.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-jest": "^28.6.0",
    "eslint-plugin-prettier": "^5.1.3",
    "jest": "^29.7.0",
    "jsarch": "^6.0.3",
    "mermaid": "^11.4.1",
    "prettier": "^3.3.3",
    "rimraf": "^6.0.1",
    "schema2dts": "^7.0.2",
    "tsx": "^4.7.1",
    "typescript": "^5.5.3",
    "typescript-eslint": "^7.16.0",
  },
  "engines": {
    "node": ">=20.11.1",
  },
  "files": [
    "bin",
    "dist",
    "src",
    "LICENSE",
    "README.md",
    "CHANGELOG.md",
  ],
  "jest": {
    "coverageReporters": [
      "lcov",
      "html",
    ],
    "extensionsToTreatAsEsm": [
      ".ts",
    ],
    "moduleNameMapper": {
      "#(.*)": "<rootDir>/../../node_modules/$1",
      "(.+)\\.js": "$1",
    },
    "prettierPath": null,
    "roots": [
      "<rootDir>/src",
    ],
    "testEnvironment": "node",
    "testPathIgnorePatterns": [
      "/node_modules/",
    ],
    "transform": {
      "^.+\\.tsx?$": [
        "@swc/jest",
        {},
      ],
    },
  },
  "keywords": [
    "whook",
  ],
  "license": "SEE LICENSE",
  "main": "dist/index.js",
  "name": "super-project",
  "overrides": {
    "eslint": "^9.7.0",
  },
  "prettier": {
    "printWidth": 80,
    "proseWrap": "always",
    "semi": true,
    "singleQuote": true,
    "trailingComma": "all",
  },
  "private": true,
  "scripts": {
    "apitypes": "npm run --silent whook -- generateOpenAPISchema --authenticated=true | npm run --silent whook -- generateOpenAPITypes > src/openAPISchema.d.ts",
    "architecture": "jsarch 'src/**/*.ts' > ARCHITECTURE.md && git add ARCHITECTURE.md",
    "build": "rimraf 'dist' && tsc --outDir dist",
    "cover": "npm run jest -- --coverage",
    "debug": "NODE_OPTIONS=\${NODE_OPTIONS:-'--inspect'} NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 DEBUG=\${DEBUG:-whook} tsx bin/dev",
    "dev": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 tsx bin/dev.js",
    "format": "npm run prettier",
    "graph": "npm run graph:build && npm run graph:generate && git add DEPENDENCIES.mmd*",
    "graph:build": "MERMAID_RUN=1 npm run --silent dev > DEPENDENCIES.mmd",
    "graph:generate": "mmdc -i DEPENDENCIES.mmd -o DEPENDENCIES.mmd.svg",
    "jest": "NODE_OPTIONS=--experimental-vm-modules NODE_ENV=test jest",
    "lint": "eslint 'src/**/*.ts'",
    "postbuild": "NODE_ENV=\${NODE_ENV:-development} tsx bin/build.js",
    "prettier": "prettier --write 'src/**/*.ts'",
    "rebuild": "swc ./src -s -d dist -C jsc.target=es2022",
    "repl": "NODE_ENV=\${NODE_ENV:-development} tsx bin/repl.js",
    "start": "NODE_ENV=\${NODE_ENV:-development} node bin/start.js",
    "test": "NODE_ENV=test npm run build && npm run jest",
    "type-check": "tsc --pretty --noEmit",
    "watch": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 tsx bin/watch.js",
    "whook": "NODE_ENV=\${NODE_ENV:-development} whook",
    "whook-debug": "NODE_OPTIONS=\${NODE_OPTIONS:-'--inspect'} NODE_ENV=\${NODE_ENV:-development} DEBUG=\${DEBUG:-whook} tsx bin/whook.js",
    "whook-dev": "NODE_ENV=\${NODE_ENV:-development} tsx bin/whook.js",
  },
  "type": "module",
  "types": "dist/index.d.ts",
  "version": "0.0.0",
}
`);
    expect({
      copyCalls: copy.mock.calls,
      outputFileCalls: outputFile.mock.calls,
      readFileCalls: readFile.mock.calls,
      execCalls: exec.mock.calls,
      oraCalls: ora.mock.calls,
      oraStartCalls: oraInstance.start.mock.calls,
      oraStopAndPersistCalls: oraInstance.stopAndPersist.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      readdirCalls: readFile.mock.calls,
    }).toMatchSnapshot();
  });

  it('should handle git initialization problems', async () => {
    readdir.mockResolvedValueOnce(['local', 'production']);
    copy.mockResolvedValueOnce(new YError('E_ACCESS'));
    axios.mockResolvedValueOnce({
      data: 'node_modules',
    });
    outputFile.mockResolvedValueOnce(undefined);
    outputFile.mockResolvedValueOnce(undefined);
    outputFile.mockResolvedValueOnce(undefined);
    exec.mockImplementationOnce((_, _2, cb) => cb(new YError('E_ACCESS')));
    exec.mockImplementationOnce((_, _2, cb) =>
      cb(null, 'Installed dependencies!'),
    );

    const createWhook = await initCreateWhook({
      CWD,
      SOURCE_DIR,
      author,
      project,
      outputFile: outputFile as any,
      readFile: readFile as any,
      readdir: readdir as any,
      exec: exec as any,
      copy,
      axios: axios as any,
      ora: ora as any,
      log,
    });

    await createWhook();

    expect(
      JSON.parse(
        outputFile.mock.calls
          .find((call) => call[0].toString().endsWith('package.json'))?.[1]
          ?.toString() || '',
      ),
    ).toMatchInlineSnapshot(`
{
  "author": {
    "email": "wayne@warner.com",
    "name": "Wayne Campbell",
  },
  "dependencies": {
    "@apidevtools/swagger-parser": "^10.1.0",
    "@whook/authorization": "<current_version>",
    "@whook/cors": "<current_version>",
    "@whook/http-router": "<current_version>",
    "@whook/http-server": "<current_version>",
    "@whook/http-transaction": "<current_version>",
    "@whook/swagger-ui": "<current_version>",
    "@whook/whook": "<current_version>",
    "application-services": "^6.1.0",
    "common-services": "^16.0.4",
    "http-auth-utils": "^6.0.1",
    "jwt-service": "^10.1.1",
    "knifecycle": "^17.2.1",
    "openapi-types": "^12.1.3",
    "pkg-dir": "^8.0.0",
    "strict-qs": "^8.0.3",
    "type-fest": "^4.26.1",
    "yerror": "^8.0.0",
    "yhttperror": "^8.0.0",
  },
  "description": "A new Whook project",
  "devDependencies": {
    "@eslint/js": "^9.7.0",
    "@mermaid-js/mermaid-cli": "^11.4.0",
    "@swc/cli": "^0.4.0",
    "@swc/core": "^1.6.13",
    "@swc/helpers": "^0.5.12",
    "@swc/jest": "^0.2.36",
    "axios": "^1.7.7",
    "chokidar": "^3.5.3",
    "esbuild-node-externals": "^1.13.1",
    "eslint": "^9.7.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-jest": "^28.6.0",
    "eslint-plugin-prettier": "^5.1.3",
    "jest": "^29.7.0",
    "jsarch": "^6.0.3",
    "mermaid": "^11.4.1",
    "prettier": "^3.3.3",
    "rimraf": "^6.0.1",
    "schema2dts": "^7.0.2",
    "tsx": "^4.7.1",
    "typescript": "^5.5.3",
    "typescript-eslint": "^7.16.0",
  },
  "engines": {
    "node": ">=20.11.1",
  },
  "files": [
    "bin",
    "dist",
    "src",
    "LICENSE",
    "README.md",
    "CHANGELOG.md",
  ],
  "jest": {
    "coverageReporters": [
      "lcov",
      "html",
    ],
    "extensionsToTreatAsEsm": [
      ".ts",
    ],
    "moduleNameMapper": {
      "#(.*)": "<rootDir>/../../node_modules/$1",
      "(.+)\\.js": "$1",
    },
    "prettierPath": null,
    "roots": [
      "<rootDir>/src",
    ],
    "testEnvironment": "node",
    "testPathIgnorePatterns": [
      "/node_modules/",
    ],
    "transform": {
      "^.+\\.tsx?$": [
        "@swc/jest",
        {},
      ],
    },
  },
  "keywords": [
    "whook",
  ],
  "license": "SEE LICENSE",
  "main": "dist/index.js",
  "name": "super-project",
  "overrides": {
    "eslint": "^9.7.0",
  },
  "prettier": {
    "printWidth": 80,
    "proseWrap": "always",
    "semi": true,
    "singleQuote": true,
    "trailingComma": "all",
  },
  "private": true,
  "scripts": {
    "apitypes": "npm run --silent whook -- generateOpenAPISchema --authenticated=true | npm run --silent whook -- generateOpenAPITypes > src/openAPISchema.d.ts",
    "architecture": "jsarch 'src/**/*.ts' > ARCHITECTURE.md && git add ARCHITECTURE.md",
    "build": "rimraf 'dist' && tsc --outDir dist",
    "cover": "npm run jest -- --coverage",
    "debug": "NODE_OPTIONS=\${NODE_OPTIONS:-'--inspect'} NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 DEBUG=\${DEBUG:-whook} tsx bin/dev",
    "dev": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 tsx bin/dev.js",
    "format": "npm run prettier",
    "graph": "npm run graph:build && npm run graph:generate && git add DEPENDENCIES.mmd*",
    "graph:build": "MERMAID_RUN=1 npm run --silent dev > DEPENDENCIES.mmd",
    "graph:generate": "mmdc -i DEPENDENCIES.mmd -o DEPENDENCIES.mmd.svg",
    "jest": "NODE_OPTIONS=--experimental-vm-modules NODE_ENV=test jest",
    "lint": "eslint 'src/**/*.ts'",
    "postbuild": "NODE_ENV=\${NODE_ENV:-development} tsx bin/build.js",
    "prettier": "prettier --write 'src/**/*.ts'",
    "rebuild": "swc ./src -s -d dist -C jsc.target=es2022",
    "repl": "NODE_ENV=\${NODE_ENV:-development} tsx bin/repl.js",
    "start": "NODE_ENV=\${NODE_ENV:-development} node bin/start.js",
    "test": "NODE_ENV=test npm run build && npm run jest",
    "type-check": "tsc --pretty --noEmit",
    "watch": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 tsx bin/watch.js",
    "whook": "NODE_ENV=\${NODE_ENV:-development} whook",
    "whook-debug": "NODE_OPTIONS=\${NODE_OPTIONS:-'--inspect'} NODE_ENV=\${NODE_ENV:-development} DEBUG=\${DEBUG:-whook} tsx bin/whook.js",
    "whook-dev": "NODE_ENV=\${NODE_ENV:-development} tsx bin/whook.js",
  },
  "type": "module",
  "types": "dist/index.d.ts",
  "version": "0.0.0",
}
`);
    expect({
      copyCalls: copy.mock.calls,
      outputFileCalls: outputFile.mock.calls,
      readFileCalls: readFile.mock.calls,
      execCalls: exec.mock.calls,
      oraCalls: ora.mock.calls,
      oraStartCalls: oraInstance.start.mock.calls,
      oraStopAndPersistCalls: oraInstance.stopAndPersist.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      readdirCalls: readFile.mock.calls,
    }).toMatchSnapshot();
  });

  it('should fail with access problems', async () => {
    readdir.mockResolvedValueOnce(['local', 'production']);
    copy.mockRejectedValueOnce(new YError('E_ACCESS'));
    axios.mockResolvedValueOnce({
      data: 'node_modules',
    });
    outputFile.mockResolvedValueOnce(undefined);
    outputFile.mockResolvedValueOnce(undefined);
    outputFile.mockResolvedValueOnce(undefined);
    exec.mockImplementationOnce((_, _2, cb) => cb(null, ''));
    exec.mockImplementationOnce((_, _2, cb) =>
      cb(null, 'Installed dependencies!'),
    );

    try {
      const createWhook = await initCreateWhook({
        CWD,
        SOURCE_DIR,
        author,
        project,
        outputFile: outputFile as any,
        readFile: readFile as any,
        readdir: readdir as any,
        exec: exec as any,
        copy,
        axios: axios as any,
        ora: ora as any,
        log,
      });

      await createWhook();

      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: (err as YError).code,
        errorParams: (err as YError).params,
      }).toMatchInlineSnapshot(`
        {
          "errorCode": "E_ACCESS",
          "errorParams": [],
        }
      `);
      expect({
        copyCalls: copy.mock.calls,
        outputFileCalls: outputFile.mock.calls,
        readFileCalls: readFile.mock.calls,
        execCalls: exec.mock.calls,
        oraCalls: ora.mock.calls,
        oraStartCalls: oraInstance.start.mock.calls,
        oraStopAndPersistCalls: oraInstance.stopAndPersist.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readdirCalls: readdir.mock.calls,
      }).toMatchSnapshot();
    }
  });
});
