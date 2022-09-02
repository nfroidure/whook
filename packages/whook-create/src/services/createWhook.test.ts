import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import initCreateWhook from './createWhook.js';
import { YError } from 'yerror';
import { readFileSync } from 'fs';
import type { LogService } from 'common-services';
import type { PathLike } from 'fs-extra';

const _packageJSON = JSON.parse(
  readFileSync('../whook-example/package.json').toString(),
);

describe('initCreateWhook', () => {
  const CWD = '/home/whoiam/projects/';
  const SOURCE_DIR = '/var/lib/node/node_modules/whook-example';
  const packageJSON = {
    ..._packageJSON,
    dependencies: {
      ..._packageJSON.dependencies,
      '@whook/authorization': '<current_version>',
      '@whook/cli': '<current_version>',
      '@whook/cors': '<current_version>',
      '@whook/http-router': '<current_version>',
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
  const writeFile = jest.fn<(file: PathLike, data: Buffer) => Promise<void>>();
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
    writeFile.mockReset();
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
    readFile.mockResolvedValue(
      Buffer.from(`
# test
> yolo

[//]: # (::contents:start)

YOLO

[//]: # (::contents:end)

# Authors
Mr Bean

    `),
    );
  });

  it('should work', async () => {
    readFile.mockResolvedValueOnce(Buffer.from(JSON.stringify(packageJSON)));
    readdir.mockResolvedValueOnce(['development', 'production']);
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
    writeFile.mockResolvedValueOnce(undefined);
    writeFile.mockResolvedValueOnce(undefined);
    writeFile.mockResolvedValueOnce(undefined);
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
      writeFile: writeFile as any,
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
        writeFile.mock.calls
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
          "@whook/cli": "<current_version>",
          "@whook/cors": "<current_version>",
          "@whook/http-router": "<current_version>",
          "@whook/http-server": "^10.0.3",
          "@whook/http-transaction": "<current_version>",
          "@whook/swagger-ui": "<current_version>",
          "@whook/whook": "<current_version>",
          "common-services": "^11.1.0",
          "http-auth-utils": "^3.0.4",
          "jwt-service": "^9.0.2",
          "knifecycle": "^14.1.0",
          "openapi-schema-validator": "^12.0.2",
          "openapi-types": "^12.0.2",
          "strict-qs": "^7.0.1",
          "type-fest": "^2.19.0",
          "yerror": "^6.1.1",
          "yhttperror": "^6.1.1",
        },
        "description": "A new Whook project",
        "devDependencies": {
          "@typescript-eslint/eslint-plugin": "^5.36.0",
          "@typescript-eslint/parser": "^5.36.0",
          "axios": "^0.27.2",
          "chokidar": "^3.5.1",
          "esbuild": "^0.15.6",
          "esbuild-jest": "^0.5.0",
          "esbuild-node-externals": "^1.5.0",
          "eslint": "^8.23.0",
          "eslint-config-prettier": "^8.5.0",
          "eslint-plugin-prettier": "^4.2.1",
          "jest": "^29.0.1",
          "jsarch": "^6.0.0",
          "parse-gitignore": "^1.0.1",
          "prettier": "^2.7.1",
          "rimraf": "^3.0.2",
          "schema2dts": "^4.1.1",
          "ts-node": "^10.8.1",
          "typescript": "^4.8.2",
        },
        "engines": {
          "node": ">=16.15.0",
        },
        "eslintConfig": {
          "env": {
            "es6": true,
            "jest": true,
            "mocha": true,
            "node": true,
          },
          "extends": [
            "eslint:recommended",
            "plugin:prettier/recommended",
            "plugin:@typescript-eslint/eslint-recommended",
            "plugin:@typescript-eslint/recommended",
          ],
          "ignorePatterns": [
            "*.d.ts",
          ],
          "parser": "@typescript-eslint/parser",
          "parserOptions": {
            "ecmaVersion": 2018,
            "modules": true,
            "sourceType": "script",
          },
          "plugins": [
            "prettier",
          ],
          "rules": {
            "prettier/prettier": "error",
          },
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
              "esbuild-jest",
              {
                "format": "esm",
                "sourcemap": true,
              },
            ],
          },
        },
        "keywords": [
          "whook",
        ],
        "license": "SEE LICENSE",
        "main": "dist/index.js",
        "name": "super-project",
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
          "build": "rimraf -f 'dist' && tsc --outDir dist",
          "cover": "npm run jest -- --coverage",
          "debug": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 DEBUG=\${DEBUG:-whook} ts-node --esm --inspect bin/dev",
          "dev": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 ts-node --esm --files bin/dev.js",
          "genPackagelock": "npm i --package-lock-only",
          "jest": "NODE_OPTIONS=--experimental-vm-modules NODE_ENV=test jest",
          "lint": "eslint 'src/**/*.ts'",
          "postbuild": "PROJECT_SRC="$PWD/src" NODE_ENV=\${NODE_ENV:-development} ts-node --esm --files -- bin/build.js",
          "prettier": "prettier --write 'src/**/*.ts'",
          "start": "PROJECT_SRC="$PWD/dist" NODE_ENV=\${NODE_ENV:-development} node bin/start.js",
          "test": "NODE_ENV=test npm run build && npm run jest",
          "watch": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 ts-node --esm --files bin/watch.js",
          "whook": "NODE_ENV=\${NODE_ENV:-development} whook",
          "whook-dev": "PROJECT_SRC="$PWD/src" NODE_ENV=\${NODE_ENV:-development} ts-node --esm --files -- bin/whook.js",
          "whook-repl": "PROJECT_SRC="$PWD/src" NODE_ENV=\${NODE_ENV:-development} ts-node --esm --files -- bin/repl.js",
        },
        "type": "module",
        "types": "dist/index.d.ts",
        "version": "0.0.0",
      }
    `);
    expect({
      copyCalls: copy.mock.calls,
      writeFileCalls: writeFile.mock.calls,
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
    readFile.mockResolvedValueOnce(Buffer.from(JSON.stringify(packageJSON)));
    readdir.mockResolvedValueOnce(['development', 'production']);
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
    writeFile.mockResolvedValueOnce(undefined);
    writeFile.mockResolvedValueOnce(undefined);
    writeFile.mockResolvedValueOnce(undefined);
    exec.mockImplementationOnce((_, _2, cb) => cb(new YError('E_ACCESS')));
    exec.mockImplementationOnce((_, _2, cb) =>
      cb(null, 'Installed dependencies!'),
    );

    const createWhook = await initCreateWhook({
      CWD,
      SOURCE_DIR,
      author,
      project,
      writeFile: writeFile as any,
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
        writeFile.mock.calls
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
          "@whook/cli": "<current_version>",
          "@whook/cors": "<current_version>",
          "@whook/http-router": "<current_version>",
          "@whook/http-server": "^10.0.3",
          "@whook/http-transaction": "<current_version>",
          "@whook/swagger-ui": "<current_version>",
          "@whook/whook": "<current_version>",
          "common-services": "^11.1.0",
          "http-auth-utils": "^3.0.4",
          "jwt-service": "^9.0.2",
          "knifecycle": "^14.1.0",
          "openapi-schema-validator": "^12.0.2",
          "openapi-types": "^12.0.2",
          "strict-qs": "^7.0.1",
          "type-fest": "^2.19.0",
          "yerror": "^6.1.1",
          "yhttperror": "^6.1.1",
        },
        "description": "A new Whook project",
        "devDependencies": {
          "@typescript-eslint/eslint-plugin": "^5.36.0",
          "@typescript-eslint/parser": "^5.36.0",
          "axios": "^0.27.2",
          "chokidar": "^3.5.1",
          "esbuild": "^0.15.6",
          "esbuild-jest": "^0.5.0",
          "esbuild-node-externals": "^1.5.0",
          "eslint": "^8.23.0",
          "eslint-config-prettier": "^8.5.0",
          "eslint-plugin-prettier": "^4.2.1",
          "jest": "^29.0.1",
          "jsarch": "^6.0.0",
          "parse-gitignore": "^1.0.1",
          "prettier": "^2.7.1",
          "rimraf": "^3.0.2",
          "schema2dts": "^4.1.1",
          "ts-node": "^10.8.1",
          "typescript": "^4.8.2",
        },
        "engines": {
          "node": ">=16.15.0",
        },
        "eslintConfig": {
          "env": {
            "es6": true,
            "jest": true,
            "mocha": true,
            "node": true,
          },
          "extends": [
            "eslint:recommended",
            "plugin:prettier/recommended",
            "plugin:@typescript-eslint/eslint-recommended",
            "plugin:@typescript-eslint/recommended",
          ],
          "ignorePatterns": [
            "*.d.ts",
          ],
          "parser": "@typescript-eslint/parser",
          "parserOptions": {
            "ecmaVersion": 2018,
            "modules": true,
            "sourceType": "script",
          },
          "plugins": [
            "prettier",
          ],
          "rules": {
            "prettier/prettier": "error",
          },
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
              "esbuild-jest",
              {
                "format": "esm",
                "sourcemap": true,
              },
            ],
          },
        },
        "keywords": [
          "whook",
        ],
        "license": "SEE LICENSE",
        "main": "dist/index.js",
        "name": "super-project",
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
          "build": "rimraf -f 'dist' && tsc --outDir dist",
          "cover": "npm run jest -- --coverage",
          "debug": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 DEBUG=\${DEBUG:-whook} ts-node --esm --inspect bin/dev",
          "dev": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 ts-node --esm --files bin/dev.js",
          "genPackagelock": "npm i --package-lock-only",
          "jest": "NODE_OPTIONS=--experimental-vm-modules NODE_ENV=test jest",
          "lint": "eslint 'src/**/*.ts'",
          "postbuild": "PROJECT_SRC="$PWD/src" NODE_ENV=\${NODE_ENV:-development} ts-node --esm --files -- bin/build.js",
          "prettier": "prettier --write 'src/**/*.ts'",
          "start": "PROJECT_SRC="$PWD/dist" NODE_ENV=\${NODE_ENV:-development} node bin/start.js",
          "test": "NODE_ENV=test npm run build && npm run jest",
          "watch": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 ts-node --esm --files bin/watch.js",
          "whook": "NODE_ENV=\${NODE_ENV:-development} whook",
          "whook-dev": "PROJECT_SRC="$PWD/src" NODE_ENV=\${NODE_ENV:-development} ts-node --esm --files -- bin/whook.js",
          "whook-repl": "PROJECT_SRC="$PWD/src" NODE_ENV=\${NODE_ENV:-development} ts-node --esm --files -- bin/repl.js",
        },
        "type": "module",
        "types": "dist/index.d.ts",
        "version": "0.0.0",
      }
    `);
    expect({
      copyCalls: copy.mock.calls,
      writeFileCalls: writeFile.mock.calls,
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
    readFile.mockResolvedValueOnce(Buffer.from(JSON.stringify(packageJSON)));
    readdir.mockResolvedValueOnce(['development', 'production']);
    copy.mockResolvedValueOnce(new YError('E_ACCESS'));
    axios.mockResolvedValueOnce({
      data: 'node_modules',
    });
    writeFile.mockResolvedValueOnce(undefined);
    writeFile.mockResolvedValueOnce(undefined);
    writeFile.mockResolvedValueOnce(undefined);
    exec.mockImplementationOnce((_, _2, cb) => cb(new YError('E_ACCESS')));
    exec.mockImplementationOnce((_, _2, cb) =>
      cb(null, 'Installed dependencies!'),
    );

    const createWhook = await initCreateWhook({
      CWD,
      SOURCE_DIR,
      author,
      project,
      writeFile: writeFile as any,
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
        writeFile.mock.calls
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
          "@whook/cli": "<current_version>",
          "@whook/cors": "<current_version>",
          "@whook/http-router": "<current_version>",
          "@whook/http-server": "^10.0.3",
          "@whook/http-transaction": "<current_version>",
          "@whook/swagger-ui": "<current_version>",
          "@whook/whook": "<current_version>",
          "common-services": "^11.1.0",
          "http-auth-utils": "^3.0.4",
          "jwt-service": "^9.0.2",
          "knifecycle": "^14.1.0",
          "openapi-schema-validator": "^12.0.2",
          "openapi-types": "^12.0.2",
          "strict-qs": "^7.0.1",
          "type-fest": "^2.19.0",
          "yerror": "^6.1.1",
          "yhttperror": "^6.1.1",
        },
        "description": "A new Whook project",
        "devDependencies": {
          "@typescript-eslint/eslint-plugin": "^5.36.0",
          "@typescript-eslint/parser": "^5.36.0",
          "axios": "^0.27.2",
          "chokidar": "^3.5.1",
          "esbuild": "^0.15.6",
          "esbuild-jest": "^0.5.0",
          "esbuild-node-externals": "^1.5.0",
          "eslint": "^8.23.0",
          "eslint-config-prettier": "^8.5.0",
          "eslint-plugin-prettier": "^4.2.1",
          "jest": "^29.0.1",
          "jsarch": "^6.0.0",
          "parse-gitignore": "^1.0.1",
          "prettier": "^2.7.1",
          "rimraf": "^3.0.2",
          "schema2dts": "^4.1.1",
          "ts-node": "^10.8.1",
          "typescript": "^4.8.2",
        },
        "engines": {
          "node": ">=16.15.0",
        },
        "eslintConfig": {
          "env": {
            "es6": true,
            "jest": true,
            "mocha": true,
            "node": true,
          },
          "extends": [
            "eslint:recommended",
            "plugin:prettier/recommended",
            "plugin:@typescript-eslint/eslint-recommended",
            "plugin:@typescript-eslint/recommended",
          ],
          "ignorePatterns": [
            "*.d.ts",
          ],
          "parser": "@typescript-eslint/parser",
          "parserOptions": {
            "ecmaVersion": 2018,
            "modules": true,
            "sourceType": "script",
          },
          "plugins": [
            "prettier",
          ],
          "rules": {
            "prettier/prettier": "error",
          },
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
              "esbuild-jest",
              {
                "format": "esm",
                "sourcemap": true,
              },
            ],
          },
        },
        "keywords": [
          "whook",
        ],
        "license": "SEE LICENSE",
        "main": "dist/index.js",
        "name": "super-project",
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
          "build": "rimraf -f 'dist' && tsc --outDir dist",
          "cover": "npm run jest -- --coverage",
          "debug": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 DEBUG=\${DEBUG:-whook} ts-node --esm --inspect bin/dev",
          "dev": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 ts-node --esm --files bin/dev.js",
          "genPackagelock": "npm i --package-lock-only",
          "jest": "NODE_OPTIONS=--experimental-vm-modules NODE_ENV=test jest",
          "lint": "eslint 'src/**/*.ts'",
          "postbuild": "PROJECT_SRC="$PWD/src" NODE_ENV=\${NODE_ENV:-development} ts-node --esm --files -- bin/build.js",
          "prettier": "prettier --write 'src/**/*.ts'",
          "start": "PROJECT_SRC="$PWD/dist" NODE_ENV=\${NODE_ENV:-development} node bin/start.js",
          "test": "NODE_ENV=test npm run build && npm run jest",
          "watch": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 ts-node --esm --files bin/watch.js",
          "whook": "NODE_ENV=\${NODE_ENV:-development} whook",
          "whook-dev": "PROJECT_SRC="$PWD/src" NODE_ENV=\${NODE_ENV:-development} ts-node --esm --files -- bin/whook.js",
          "whook-repl": "PROJECT_SRC="$PWD/src" NODE_ENV=\${NODE_ENV:-development} ts-node --esm --files -- bin/repl.js",
        },
        "type": "module",
        "types": "dist/index.d.ts",
        "version": "0.0.0",
      }
    `);
    expect({
      copyCalls: copy.mock.calls,
      writeFileCalls: writeFile.mock.calls,
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
    readFile.mockResolvedValueOnce(Buffer.from(JSON.stringify(packageJSON)));
    readdir.mockResolvedValueOnce(['development', 'production']);
    copy.mockRejectedValueOnce(new YError('E_ACCESS'));
    axios.mockResolvedValueOnce({
      data: 'node_modules',
    });
    writeFile.mockResolvedValueOnce(undefined);
    writeFile.mockResolvedValueOnce(undefined);
    writeFile.mockResolvedValueOnce(undefined);
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
        writeFile: writeFile as any,
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
        writeFileCalls: writeFile.mock.calls,
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
