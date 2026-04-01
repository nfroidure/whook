/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initCreateWhook from './createWhook.js';
import { YError } from 'yerror';
import { readFileSync } from 'node:fs';
import { type LogService } from 'common-services';
import { type PathLike } from 'fs-extra';

const _packageJSON = JSON.parse(
  readFileSync('../whook-example/package.json').toString(),
);
const FILE_CONTENTS: Record<string, string> = {
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

  test('should work', async () => {
    readdir.mockResolvedValueOnce(['local', 'production']);
    copy.mockImplementationOnce(
      (
        _: unknown,
        _2: unknown,
        { filter }: { filter: <T>(...args: T[]) => T },
      ) =>
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
    exec.mockImplementationOnce(
      (
        _: unknown,
        _2: unknown,
        cb: (err?: Error | null, data?: string) => undefined,
      ) => cb(null, 'Initialized an empty git repository!'),
    );
    exec.mockImplementationOnce(
      (
        _: unknown,
        _2: unknown,
        cb: (err?: Error | null, data?: string) => undefined,
      ) => cb(null, 'Installed dependencies!'),
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
         "@whook/authorization": "<current_version>",
         "@whook/cors": "<current_version>",
         "@whook/http-router": "<current_version>",
         "@whook/http-server": "<current_version>",
         "@whook/http-transaction": "<current_version>",
         "@whook/swagger-ui": "<current_version>",
         "@whook/whook": "<current_version>",
         "application-services": "^8.0.1",
         "common-services": "^18.0.1",
         "http-auth-utils": "^7.0.0",
         "jwt-service": "^12.0.0",
         "knifecycle": "^20.0.0",
         "strict-qs": "^9.0.0",
         "type-fest": "^5.5.0",
         "ya-json-schema-types": "^2.0.1",
         "ya-open-api-types": "^2.1.1",
         "yerror": "^9.1.1",
         "yhttperror": "^9.0.1",
       },
       "description": "A new Whook project",
       "devDependencies": {
         "@eslint/js": "^10.0.1",
         "@swc/cli": "^0.8.0",
         "@swc/core": "^1.15.21",
         "@swc/jest": "^0.2.39",
         "axios": "^1.13.6",
         "esbuild-node-externals": "^1.20.1",
         "eslint": "^10.1.0",
         "eslint-config-prettier": "^10.1.8",
         "eslint-plugin-jest": "^29.15.1",
         "eslint-plugin-prettier": "^5.5.5",
         "jest": "^30.3.0",
         "jsarch": "^7.0.0",
         "prettier": "^3.8.1",
         "rimraf": "^6.1.3",
         "schema2dts": "^9.0.0",
         "streamtest": "^4.0.0",
         "tsx": "^4.21.0",
         "typescript": "^6.0.2",
         "typescript-eslint": "^8.57.2",
       },
       "engines": {
         "node": ">=24.14.0",
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
         "@typescript-eslint/eslint-plugin": {
           "typescript": "^6",
         },
         "@typescript-eslint/parser": {
           "typescript": "^6",
         },
         "typescript-eslint": {
           "typescript": "^6",
         },
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
         "cover": "node --run jest -- --coverage",
         "debug": "NODE_OPTIONS=\${NODE_OPTIONS:-'--inspect'} NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 DEBUG=\${DEBUG:-whook} tsx bin/whook.js",
         "dev": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 tsx src/run.js",
         "format": "node --run prettier",
         "jest": "NODE_OPTIONS=--experimental-vm-modules NODE_ENV=test jest",
         "lint": "eslint 'src/**/*.ts'",
         "postbuild": "NODE_ENV=\${NODE_ENV:-development} tsx src/runBuild.js",
         "prettier": "prettier --write 'src/**/*.ts'",
         "rebuild": "swc ./src -s -d dist -C jsc.target=es2022",
         "repl": "NODE_ENV=\${NODE_ENV:-development} tsx src/run.js -- __inject repl",
         "start": "NODE_ENV=\${NODE_ENV:-development} node dist/run.js",
         "test": "NODE_ENV=test npm run build && node --run jest && node --run jest",
         "watch": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 tsx src/runWatch.js",
         "whook": "NODE_ENV=\${NODE_ENV:-development} whook",
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

  test('should handle network issues', async () => {
    readdir.mockResolvedValueOnce(['local', 'production']);
    copy.mockImplementationOnce(
      (
        _: unknown,
        _2: unknown,
        { filter }: { filter: <T>(...args: T[]) => T },
      ) =>
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
    exec.mockImplementationOnce(
      (
        _: unknown,
        _2: unknown,
        cb: (err?: Error | null, data?: string) => undefined,
      ) => cb(new YError('E_ACCESS')),
    );
    exec.mockImplementationOnce(
      (
        _: unknown,
        _2: unknown,
        cb: (err?: Error | null, data?: string) => undefined,
      ) => cb(null, 'Installed dependencies!'),
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
         "@whook/authorization": "<current_version>",
         "@whook/cors": "<current_version>",
         "@whook/http-router": "<current_version>",
         "@whook/http-server": "<current_version>",
         "@whook/http-transaction": "<current_version>",
         "@whook/swagger-ui": "<current_version>",
         "@whook/whook": "<current_version>",
         "application-services": "^8.0.1",
         "common-services": "^18.0.1",
         "http-auth-utils": "^7.0.0",
         "jwt-service": "^12.0.0",
         "knifecycle": "^20.0.0",
         "strict-qs": "^9.0.0",
         "type-fest": "^5.5.0",
         "ya-json-schema-types": "^2.0.1",
         "ya-open-api-types": "^2.1.1",
         "yerror": "^9.1.1",
         "yhttperror": "^9.0.1",
       },
       "description": "A new Whook project",
       "devDependencies": {
         "@eslint/js": "^10.0.1",
         "@swc/cli": "^0.8.0",
         "@swc/core": "^1.15.21",
         "@swc/jest": "^0.2.39",
         "axios": "^1.13.6",
         "esbuild-node-externals": "^1.20.1",
         "eslint": "^10.1.0",
         "eslint-config-prettier": "^10.1.8",
         "eslint-plugin-jest": "^29.15.1",
         "eslint-plugin-prettier": "^5.5.5",
         "jest": "^30.3.0",
         "jsarch": "^7.0.0",
         "prettier": "^3.8.1",
         "rimraf": "^6.1.3",
         "schema2dts": "^9.0.0",
         "streamtest": "^4.0.0",
         "tsx": "^4.21.0",
         "typescript": "^6.0.2",
         "typescript-eslint": "^8.57.2",
       },
       "engines": {
         "node": ">=24.14.0",
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
         "@typescript-eslint/eslint-plugin": {
           "typescript": "^6",
         },
         "@typescript-eslint/parser": {
           "typescript": "^6",
         },
         "typescript-eslint": {
           "typescript": "^6",
         },
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
         "cover": "node --run jest -- --coverage",
         "debug": "NODE_OPTIONS=\${NODE_OPTIONS:-'--inspect'} NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 DEBUG=\${DEBUG:-whook} tsx bin/whook.js",
         "dev": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 tsx src/run.js",
         "format": "node --run prettier",
         "jest": "NODE_OPTIONS=--experimental-vm-modules NODE_ENV=test jest",
         "lint": "eslint 'src/**/*.ts'",
         "postbuild": "NODE_ENV=\${NODE_ENV:-development} tsx src/runBuild.js",
         "prettier": "prettier --write 'src/**/*.ts'",
         "rebuild": "swc ./src -s -d dist -C jsc.target=es2022",
         "repl": "NODE_ENV=\${NODE_ENV:-development} tsx src/run.js -- __inject repl",
         "start": "NODE_ENV=\${NODE_ENV:-development} node dist/run.js",
         "test": "NODE_ENV=test npm run build && node --run jest && node --run jest",
         "watch": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 tsx src/runWatch.js",
         "whook": "NODE_ENV=\${NODE_ENV:-development} whook",
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

  test('should handle git initialization problems', async () => {
    readdir.mockResolvedValueOnce(['local', 'production']);
    copy.mockResolvedValueOnce(new YError('E_ACCESS'));
    axios.mockResolvedValueOnce({
      data: 'node_modules',
    });
    outputFile.mockResolvedValueOnce(undefined);
    outputFile.mockResolvedValueOnce(undefined);
    outputFile.mockResolvedValueOnce(undefined);
    exec.mockImplementationOnce(
      (
        _: unknown,
        _2: unknown,
        cb: (err?: Error | null, data?: string) => undefined,
      ) => cb(new YError('E_ACCESS')),
    );
    exec.mockImplementationOnce(
      (
        _: unknown,
        _2: unknown,
        cb: (err?: Error | null, data?: string) => undefined,
      ) => cb(null, 'Installed dependencies!'),
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
         "@whook/authorization": "<current_version>",
         "@whook/cors": "<current_version>",
         "@whook/http-router": "<current_version>",
         "@whook/http-server": "<current_version>",
         "@whook/http-transaction": "<current_version>",
         "@whook/swagger-ui": "<current_version>",
         "@whook/whook": "<current_version>",
         "application-services": "^8.0.1",
         "common-services": "^18.0.1",
         "http-auth-utils": "^7.0.0",
         "jwt-service": "^12.0.0",
         "knifecycle": "^20.0.0",
         "strict-qs": "^9.0.0",
         "type-fest": "^5.5.0",
         "ya-json-schema-types": "^2.0.1",
         "ya-open-api-types": "^2.1.1",
         "yerror": "^9.1.1",
         "yhttperror": "^9.0.1",
       },
       "description": "A new Whook project",
       "devDependencies": {
         "@eslint/js": "^10.0.1",
         "@swc/cli": "^0.8.0",
         "@swc/core": "^1.15.21",
         "@swc/jest": "^0.2.39",
         "axios": "^1.13.6",
         "esbuild-node-externals": "^1.20.1",
         "eslint": "^10.1.0",
         "eslint-config-prettier": "^10.1.8",
         "eslint-plugin-jest": "^29.15.1",
         "eslint-plugin-prettier": "^5.5.5",
         "jest": "^30.3.0",
         "jsarch": "^7.0.0",
         "prettier": "^3.8.1",
         "rimraf": "^6.1.3",
         "schema2dts": "^9.0.0",
         "streamtest": "^4.0.0",
         "tsx": "^4.21.0",
         "typescript": "^6.0.2",
         "typescript-eslint": "^8.57.2",
       },
       "engines": {
         "node": ">=24.14.0",
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
         "@typescript-eslint/eslint-plugin": {
           "typescript": "^6",
         },
         "@typescript-eslint/parser": {
           "typescript": "^6",
         },
         "typescript-eslint": {
           "typescript": "^6",
         },
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
         "cover": "node --run jest -- --coverage",
         "debug": "NODE_OPTIONS=\${NODE_OPTIONS:-'--inspect'} NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 DEBUG=\${DEBUG:-whook} tsx bin/whook.js",
         "dev": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 tsx src/run.js",
         "format": "node --run prettier",
         "jest": "NODE_OPTIONS=--experimental-vm-modules NODE_ENV=test jest",
         "lint": "eslint 'src/**/*.ts'",
         "postbuild": "NODE_ENV=\${NODE_ENV:-development} tsx src/runBuild.js",
         "prettier": "prettier --write 'src/**/*.ts'",
         "rebuild": "swc ./src -s -d dist -C jsc.target=es2022",
         "repl": "NODE_ENV=\${NODE_ENV:-development} tsx src/run.js -- __inject repl",
         "start": "NODE_ENV=\${NODE_ENV:-development} node dist/run.js",
         "test": "NODE_ENV=test npm run build && node --run jest && node --run jest",
         "watch": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 tsx src/runWatch.js",
         "whook": "NODE_ENV=\${NODE_ENV:-development} whook",
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

  test('should fail with access problems', async () => {
    readdir.mockResolvedValueOnce(['local', 'production']);
    copy.mockRejectedValueOnce(new YError('E_ACCESS'));
    axios.mockResolvedValueOnce({
      data: 'node_modules',
    });
    outputFile.mockResolvedValueOnce(undefined);
    outputFile.mockResolvedValueOnce(undefined);
    outputFile.mockResolvedValueOnce(undefined);
    exec.mockImplementationOnce(
      (
        _: unknown,
        _2: unknown,
        cb: (err?: Error | null, data?: string) => undefined,
      ) => cb(null, ''),
    );
    exec.mockImplementationOnce(
      (
        _: unknown,
        _2: unknown,
        cb: (err?: Error | null, data?: string) => undefined,
      ) => cb(null, 'Installed dependencies!'),
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
        errorDebugValues: (err as YError).debugValues,
      }).toMatchInlineSnapshot(`
       {
         "errorCode": "E_ACCESS",
         "errorDebugValues": [],
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
