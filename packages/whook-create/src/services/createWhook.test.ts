import initCreateWhook from './createWhook';
import YError from 'yerror';

const _packageJSON = require('@whook/example/package.json');

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
  const writeFile = jest.fn();
  const readFile = jest.fn();
  const readdir = jest.fn();
  const exec = jest.fn();
  const copy = jest.fn();
  const axios = jest.fn();
  const ora = jest.fn();
  const oraInstance = {
    start: jest.fn(),
    stopAndPersist: jest.fn(),
  };
  const log = jest.fn();

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
    readFile.mockResolvedValueOnce(JSON.stringify(packageJSON));
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
      writeFile,
      readFile,
      readdir,
      exec: exec as any,
      copy,
      axios: axios as any,
      ora: ora as any,
      log,
    });

    await createWhook();

    expect(
      JSON.parse(
        writeFile.mock.calls.find((call) =>
          call[0].endsWith('package.json'),
        )[1],
      ),
    ).toMatchInlineSnapshot(`
      Object {
        "author": Object {
          "email": "wayne@warner.com",
          "name": "Wayne Campbell",
        },
        "babel": Object {
          "env": Object {
            "cjs": Object {
              "presets": Array [
                Array [
                  "@babel/env",
                  Object {
                    "modules": "commonjs",
                    "targets": Object {
                      "node": "10",
                    },
                  },
                ],
              ],
            },
            "mjs": Object {
              "presets": Array [
                Array [
                  "@babel/env",
                  Object {
                    "modules": false,
                    "targets": Object {
                      "node": "12",
                    },
                  },
                ],
              ],
            },
          },
          "plugins": Array [
            "@babel/proposal-class-properties",
            "@babel/plugin-proposal-object-rest-spread",
            "babel-plugin-knifecycle",
          ],
          "presets": Array [
            "@babel/typescript",
            Array [
              "@babel/env",
              Object {
                "targets": Object {
                  "node": "10.19.0",
                },
              },
            ],
          ],
          "sourceMaps": true,
        },
        "dependencies": Object {
          "@whook/authorization": "<current_version>",
          "@whook/cli": "<current_version>",
          "@whook/cors": "<current_version>",
          "@whook/http-router": "<current_version>",
          "@whook/http-transaction": "^4.0.0-alpha.43",
          "@whook/swagger-ui": "<current_version>",
          "@whook/whook": "<current_version>",
          "common-services": "^7.1.4",
          "http-auth-utils": "^2.5.0",
          "jwt-service": "^5.0.0",
          "knifecycle": "^9.1.1",
          "strict-qs": "^6.1.2",
          "yerror": "^5.0.0",
          "yhttperror": "^5.0.0",
        },
        "description": "A new Whook project",
        "devDependencies": Object {
          "@babel/cli": "^7.8.4",
          "@babel/core": "^7.9.6",
          "@babel/node": "^7.2.2",
          "@babel/plugin-proposal-class-properties": "^7.8.3",
          "@babel/plugin-proposal-object-rest-spread": "^7.9.6",
          "@babel/plugin-syntax-dynamic-import": "^7.8.3",
          "@babel/plugin-syntax-import-meta": "^7.8.3",
          "@babel/preset-env": "^7.9.6",
          "@babel/preset-typescript": "^7.9.0",
          "@babel/register": "^7.9.0",
          "@types/jest": "^25.2.2",
          "@typescript-eslint/eslint-plugin": "^2.33.0",
          "@typescript-eslint/parser": "^2.33.0",
          "axios": "^0.19.2",
          "babel-eslint": "^10.1.0",
          "babel-plugin-knifecycle": "^1.2.0",
          "eslint": "^7.0.0",
          "eslint-plugin-prettier": "^3.1.3",
          "jest": "^26.0.1",
          "jsdoc-to-markdown": "^4.0.1",
          "openapi-schema-validator": "^3.0.3",
          "prettier": "^2.0.5",
          "rimraf": "^3.0.2",
          "typescript": "^3.9.2",
        },
        "engines": Object {
          "node": ">=10.19.0",
        },
        "eslintConfig": Object {
          "env": Object {
            "es6": true,
            "jest": true,
            "mocha": true,
            "node": true,
          },
          "extends": "eslint:recommended",
          "ignorePatterns": Array [
            "*.d.ts",
          ],
          "overrides": Array [
            Object {
              "files": Array [
                "*.ts",
              ],
              "rules": Object {
                "no-unused-vars": Array [
                  1,
                  Object {
                    "args": "none",
                  },
                ],
              },
            },
          ],
          "parser": "@typescript-eslint/parser",
          "parserOptions": Object {
            "ecmaVersion": 2018,
            "modules": true,
            "sourceType": "module",
          },
          "plugins": Array [
            "prettier",
          ],
          "rules": Object {
            "prettier/prettier": "error",
          },
        },
        "files": Array [
          "bin",
          "dist",
          "src",
          "LICENSE",
          "README.md",
          "CHANGELOG.md",
        ],
        "jest": Object {
          "coverageReporters": Array [
            "lcov",
            "html",
          ],
          "roots": Array [
            "<rootDir>/src",
          ],
          "testEnvironment": "node",
          "testPathIgnorePatterns": Array [
            "/node_modules/",
          ],
        },
        "keywords": Array [
          "whook",
        ],
        "license": "SEE LICENSE",
        "main": "dist/index",
        "module": "dist/index.mjs",
        "name": "super-project",
        "prettier": Object {
          "printWidth": 80,
          "proseWrap": "always",
          "semi": true,
          "singleQuote": true,
          "trailingComma": "all",
        },
        "private": true,
        "scripts": Object {
          "build": "npm run compile && NODE_ENV=\${NODE_ENV:-development} node bin/build",
          "compile": "rimraf -f 'dist' && npm run compile:cjs && npm run compile:mjs",
          "compile:cjs": "babel --env-name=cjs --out-dir=dist --extensions '.ts,.js' --source-maps=true src",
          "compile:mjs": "babel --env-name=mjs --out-file-extension=.mjs --out-dir=dist --extensions '.ts,.js' --source-maps=true src",
          "cover": "npm run jest -- --coverage",
          "debug": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 DEBUG=\${DEBUG:-whook} babel-node --extensions '.ts,.js' --inspect bin/dev",
          "dev": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 babel-node --extensions '.ts,.js' bin/dev",
          "jest": "NODE_ENV=test jest",
          "lint": "eslint 'src/**/*.ts'",
          "precz": "npm run compile",
          "prettier": "prettier --write 'src/**/*.ts'",
          "preversion": "npm run compile",
          "start": "NODE_ENV=\${NODE_ENV:-development} node bin/start",
          "test": "npm run jest",
          "types": "rimraf -f 'dist/**/*.d.ts' && tsc --project . --declaration --emitDeclarationOnly --outDir dist",
          "whook": "NODE_ENV=\${NODE_ENV:-development} whook",
          "whook-dev": "PROJECT_SRC=\\"$PWD/src\\" NODE_ENV=\${NODE_ENV:-development} babel-node --extensions '.ts,.js' -- node_modules/@whook/cli/bin/whook.js",
        },
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
    readFile.mockResolvedValueOnce(JSON.stringify(packageJSON));
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
      writeFile,
      readFile,
      readdir,
      exec: exec as any,
      copy,
      axios: axios as any,
      ora: ora as any,
      log,
    });

    await createWhook();

    expect(
      JSON.parse(
        writeFile.mock.calls.find((call) =>
          call[0].endsWith('package.json'),
        )[1],
      ),
    ).toMatchInlineSnapshot(`
      Object {
        "author": Object {
          "email": "wayne@warner.com",
          "name": "Wayne Campbell",
        },
        "babel": Object {
          "env": Object {
            "cjs": Object {
              "presets": Array [
                Array [
                  "@babel/env",
                  Object {
                    "modules": "commonjs",
                    "targets": Object {
                      "node": "10",
                    },
                  },
                ],
              ],
            },
            "mjs": Object {
              "presets": Array [
                Array [
                  "@babel/env",
                  Object {
                    "modules": false,
                    "targets": Object {
                      "node": "12",
                    },
                  },
                ],
              ],
            },
          },
          "plugins": Array [
            "@babel/proposal-class-properties",
            "@babel/plugin-proposal-object-rest-spread",
            "babel-plugin-knifecycle",
          ],
          "presets": Array [
            "@babel/typescript",
            Array [
              "@babel/env",
              Object {
                "targets": Object {
                  "node": "10.19.0",
                },
              },
            ],
          ],
          "sourceMaps": true,
        },
        "dependencies": Object {
          "@whook/authorization": "<current_version>",
          "@whook/cli": "<current_version>",
          "@whook/cors": "<current_version>",
          "@whook/http-router": "<current_version>",
          "@whook/http-transaction": "^4.0.0-alpha.43",
          "@whook/swagger-ui": "<current_version>",
          "@whook/whook": "<current_version>",
          "common-services": "^7.1.4",
          "http-auth-utils": "^2.5.0",
          "jwt-service": "^5.0.0",
          "knifecycle": "^9.1.1",
          "strict-qs": "^6.1.2",
          "yerror": "^5.0.0",
          "yhttperror": "^5.0.0",
        },
        "description": "A new Whook project",
        "devDependencies": Object {
          "@babel/cli": "^7.8.4",
          "@babel/core": "^7.9.6",
          "@babel/node": "^7.2.2",
          "@babel/plugin-proposal-class-properties": "^7.8.3",
          "@babel/plugin-proposal-object-rest-spread": "^7.9.6",
          "@babel/plugin-syntax-dynamic-import": "^7.8.3",
          "@babel/plugin-syntax-import-meta": "^7.8.3",
          "@babel/preset-env": "^7.9.6",
          "@babel/preset-typescript": "^7.9.0",
          "@babel/register": "^7.9.0",
          "@types/jest": "^25.2.2",
          "@typescript-eslint/eslint-plugin": "^2.33.0",
          "@typescript-eslint/parser": "^2.33.0",
          "axios": "^0.19.2",
          "babel-eslint": "^10.1.0",
          "babel-plugin-knifecycle": "^1.2.0",
          "eslint": "^7.0.0",
          "eslint-plugin-prettier": "^3.1.3",
          "jest": "^26.0.1",
          "jsdoc-to-markdown": "^4.0.1",
          "openapi-schema-validator": "^3.0.3",
          "prettier": "^2.0.5",
          "rimraf": "^3.0.2",
          "typescript": "^3.9.2",
        },
        "engines": Object {
          "node": ">=10.19.0",
        },
        "eslintConfig": Object {
          "env": Object {
            "es6": true,
            "jest": true,
            "mocha": true,
            "node": true,
          },
          "extends": "eslint:recommended",
          "ignorePatterns": Array [
            "*.d.ts",
          ],
          "overrides": Array [
            Object {
              "files": Array [
                "*.ts",
              ],
              "rules": Object {
                "no-unused-vars": Array [
                  1,
                  Object {
                    "args": "none",
                  },
                ],
              },
            },
          ],
          "parser": "@typescript-eslint/parser",
          "parserOptions": Object {
            "ecmaVersion": 2018,
            "modules": true,
            "sourceType": "module",
          },
          "plugins": Array [
            "prettier",
          ],
          "rules": Object {
            "prettier/prettier": "error",
          },
        },
        "files": Array [
          "bin",
          "dist",
          "src",
          "LICENSE",
          "README.md",
          "CHANGELOG.md",
        ],
        "jest": Object {
          "coverageReporters": Array [
            "lcov",
            "html",
          ],
          "roots": Array [
            "<rootDir>/src",
          ],
          "testEnvironment": "node",
          "testPathIgnorePatterns": Array [
            "/node_modules/",
          ],
        },
        "keywords": Array [
          "whook",
        ],
        "license": "SEE LICENSE",
        "main": "dist/index",
        "module": "dist/index.mjs",
        "name": "super-project",
        "prettier": Object {
          "printWidth": 80,
          "proseWrap": "always",
          "semi": true,
          "singleQuote": true,
          "trailingComma": "all",
        },
        "private": true,
        "scripts": Object {
          "build": "npm run compile && NODE_ENV=\${NODE_ENV:-development} node bin/build",
          "compile": "rimraf -f 'dist' && npm run compile:cjs && npm run compile:mjs",
          "compile:cjs": "babel --env-name=cjs --out-dir=dist --extensions '.ts,.js' --source-maps=true src",
          "compile:mjs": "babel --env-name=mjs --out-file-extension=.mjs --out-dir=dist --extensions '.ts,.js' --source-maps=true src",
          "cover": "npm run jest -- --coverage",
          "debug": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 DEBUG=\${DEBUG:-whook} babel-node --extensions '.ts,.js' --inspect bin/dev",
          "dev": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 babel-node --extensions '.ts,.js' bin/dev",
          "jest": "NODE_ENV=test jest",
          "lint": "eslint 'src/**/*.ts'",
          "precz": "npm run compile",
          "prettier": "prettier --write 'src/**/*.ts'",
          "preversion": "npm run compile",
          "start": "NODE_ENV=\${NODE_ENV:-development} node bin/start",
          "test": "npm run jest",
          "types": "rimraf -f 'dist/**/*.d.ts' && tsc --project . --declaration --emitDeclarationOnly --outDir dist",
          "whook": "NODE_ENV=\${NODE_ENV:-development} whook",
          "whook-dev": "PROJECT_SRC=\\"$PWD/src\\" NODE_ENV=\${NODE_ENV:-development} babel-node --extensions '.ts,.js' -- node_modules/@whook/cli/bin/whook.js",
        },
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
    readFile.mockResolvedValueOnce(JSON.stringify(packageJSON));
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
      writeFile,
      readFile,
      readdir,
      exec: exec as any,
      copy,
      axios: axios as any,
      ora: ora as any,
      log,
    });

    await createWhook();

    expect(
      JSON.parse(
        writeFile.mock.calls.find((call) =>
          call[0].endsWith('package.json'),
        )[1],
      ),
    ).toMatchInlineSnapshot(`
      Object {
        "author": Object {
          "email": "wayne@warner.com",
          "name": "Wayne Campbell",
        },
        "babel": Object {
          "env": Object {
            "cjs": Object {
              "presets": Array [
                Array [
                  "@babel/env",
                  Object {
                    "modules": "commonjs",
                    "targets": Object {
                      "node": "10",
                    },
                  },
                ],
              ],
            },
            "mjs": Object {
              "presets": Array [
                Array [
                  "@babel/env",
                  Object {
                    "modules": false,
                    "targets": Object {
                      "node": "12",
                    },
                  },
                ],
              ],
            },
          },
          "plugins": Array [
            "@babel/proposal-class-properties",
            "@babel/plugin-proposal-object-rest-spread",
            "babel-plugin-knifecycle",
          ],
          "presets": Array [
            "@babel/typescript",
            Array [
              "@babel/env",
              Object {
                "targets": Object {
                  "node": "10.19.0",
                },
              },
            ],
          ],
          "sourceMaps": true,
        },
        "dependencies": Object {
          "@whook/authorization": "<current_version>",
          "@whook/cli": "<current_version>",
          "@whook/cors": "<current_version>",
          "@whook/http-router": "<current_version>",
          "@whook/http-transaction": "^4.0.0-alpha.43",
          "@whook/swagger-ui": "<current_version>",
          "@whook/whook": "<current_version>",
          "common-services": "^7.1.4",
          "http-auth-utils": "^2.5.0",
          "jwt-service": "^5.0.0",
          "knifecycle": "^9.1.1",
          "strict-qs": "^6.1.2",
          "yerror": "^5.0.0",
          "yhttperror": "^5.0.0",
        },
        "description": "A new Whook project",
        "devDependencies": Object {
          "@babel/cli": "^7.8.4",
          "@babel/core": "^7.9.6",
          "@babel/node": "^7.2.2",
          "@babel/plugin-proposal-class-properties": "^7.8.3",
          "@babel/plugin-proposal-object-rest-spread": "^7.9.6",
          "@babel/plugin-syntax-dynamic-import": "^7.8.3",
          "@babel/plugin-syntax-import-meta": "^7.8.3",
          "@babel/preset-env": "^7.9.6",
          "@babel/preset-typescript": "^7.9.0",
          "@babel/register": "^7.9.0",
          "@types/jest": "^25.2.2",
          "@typescript-eslint/eslint-plugin": "^2.33.0",
          "@typescript-eslint/parser": "^2.33.0",
          "axios": "^0.19.2",
          "babel-eslint": "^10.1.0",
          "babel-plugin-knifecycle": "^1.2.0",
          "eslint": "^7.0.0",
          "eslint-plugin-prettier": "^3.1.3",
          "jest": "^26.0.1",
          "jsdoc-to-markdown": "^4.0.1",
          "openapi-schema-validator": "^3.0.3",
          "prettier": "^2.0.5",
          "rimraf": "^3.0.2",
          "typescript": "^3.9.2",
        },
        "engines": Object {
          "node": ">=10.19.0",
        },
        "eslintConfig": Object {
          "env": Object {
            "es6": true,
            "jest": true,
            "mocha": true,
            "node": true,
          },
          "extends": "eslint:recommended",
          "ignorePatterns": Array [
            "*.d.ts",
          ],
          "overrides": Array [
            Object {
              "files": Array [
                "*.ts",
              ],
              "rules": Object {
                "no-unused-vars": Array [
                  1,
                  Object {
                    "args": "none",
                  },
                ],
              },
            },
          ],
          "parser": "@typescript-eslint/parser",
          "parserOptions": Object {
            "ecmaVersion": 2018,
            "modules": true,
            "sourceType": "module",
          },
          "plugins": Array [
            "prettier",
          ],
          "rules": Object {
            "prettier/prettier": "error",
          },
        },
        "files": Array [
          "bin",
          "dist",
          "src",
          "LICENSE",
          "README.md",
          "CHANGELOG.md",
        ],
        "jest": Object {
          "coverageReporters": Array [
            "lcov",
            "html",
          ],
          "roots": Array [
            "<rootDir>/src",
          ],
          "testEnvironment": "node",
          "testPathIgnorePatterns": Array [
            "/node_modules/",
          ],
        },
        "keywords": Array [
          "whook",
        ],
        "license": "SEE LICENSE",
        "main": "dist/index",
        "module": "dist/index.mjs",
        "name": "super-project",
        "prettier": Object {
          "printWidth": 80,
          "proseWrap": "always",
          "semi": true,
          "singleQuote": true,
          "trailingComma": "all",
        },
        "private": true,
        "scripts": Object {
          "build": "npm run compile && NODE_ENV=\${NODE_ENV:-development} node bin/build",
          "compile": "rimraf -f 'dist' && npm run compile:cjs && npm run compile:mjs",
          "compile:cjs": "babel --env-name=cjs --out-dir=dist --extensions '.ts,.js' --source-maps=true src",
          "compile:mjs": "babel --env-name=mjs --out-file-extension=.mjs --out-dir=dist --extensions '.ts,.js' --source-maps=true src",
          "cover": "npm run jest -- --coverage",
          "debug": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 DEBUG=\${DEBUG:-whook} babel-node --extensions '.ts,.js' --inspect bin/dev",
          "dev": "NODE_ENV=\${NODE_ENV:-development} DEV_MODE=1 DESTROY_SOCKETS=1 babel-node --extensions '.ts,.js' bin/dev",
          "jest": "NODE_ENV=test jest",
          "lint": "eslint 'src/**/*.ts'",
          "precz": "npm run compile",
          "prettier": "prettier --write 'src/**/*.ts'",
          "preversion": "npm run compile",
          "start": "NODE_ENV=\${NODE_ENV:-development} node bin/start",
          "test": "npm run jest",
          "types": "rimraf -f 'dist/**/*.d.ts' && tsc --project . --declaration --emitDeclarationOnly --outDir dist",
          "whook": "NODE_ENV=\${NODE_ENV:-development} whook",
          "whook-dev": "PROJECT_SRC=\\"$PWD/src\\" NODE_ENV=\${NODE_ENV:-development} babel-node --extensions '.ts,.js' -- node_modules/@whook/cli/bin/whook.js",
        },
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
    readFile.mockResolvedValueOnce(JSON.stringify(packageJSON));
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
        writeFile,
        readFile,
        readdir,
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
        errorCode: err.code,
        errorParams: err.params,
      }).toMatchInlineSnapshot(`
        Object {
          "errorCode": "E_ACCESS",
          "errorParams": Array [],
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
