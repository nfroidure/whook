import { describe, test, expect } from '@jest/globals';
import { findInitializerServiceType } from './typesGuess.js';
import { Project } from 'ts-morph';

describe('findInitializerServiceType', () => {
  describe('with simple types', () => {
    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        allowJs: true,
        declaration: true,
        moduleResolution: 99,
      },
    });
    project.createSourceFile(
      '/tmp/test.ts',
      `

export async function initTheString(t: string): Promise<string> {
  return t;
}
export async function initTheBoolean(t: boolean): Promise<boolean> {
  return t;
}
export async function initTheNumber(t: number): Promise<number> {
  return t;
}
export async function initTheConstString(
  t: 'a_const_string',
): Promise<'a_const_string'> {
  return t;
}
export type ConstStringInAType = 'a_const_string_in_a_type';
export async function initTheConstStringInAType(
  t: ConstStringInAType,
): Promise<ConstStringInAType> {
  return t;
}
export async function initTheConstNumber(t: 42): Promise<42> {
  return t;
}
export async function initTheConstBoolean(t: true): Promise<true> {
  return t;
}
export async function initOfAny(t: any): Promise<any> {
  return t;
}
export async function initOfUnknown(t: unknown): Promise<unknown> {
  return t;
}
export async function initOfNull(): Promise<null> {
  return null;
}
export async function initOfUndefined(): Promise<undefined> {
  return undefined;
}
export async function initOfNever(t: never): Promise<never> {
  return t;
}
export async function initOfVoid(): Promise<void> {}

export type MyTypeService = 'my_type_service' & {
  __tag?: 'test';
};
export async function initMyTypeService(): Promise<MyTypeService> {
  return 'my_type_service';
}

export interface MyInterfaceService {
  srv: 'my_interface_service';
}

export async function initMyInterfaceService(): Promise<MyInterfaceService> {
  return { srv: 'my_interface_service' };
}

function location<T>(t: T, s: string):T {
  return t;
};

export interface MyDefaultInterfaceService {
  srv: 'my_interface_service';
}

async function initMyDefaultInterfaceService(): Promise<MyDefaultInterfaceService> {
  return { srv: 'my_default_interface_service' };
}

export default location(initMyDefaultInterfaceService, import.meta.url);

`,
    );

    test('should find string type', async () => {
      const type = await findInitializerServiceType(project, '/tmp/test.ts', {
        serviceName: 'theString',
      });

      expect(type?.getText()).toMatchInlineSnapshot(`"string"`);
    });

    test('should find boolean type', async () => {
      const type = await findInitializerServiceType(project, '/tmp/test.ts', {
        serviceName: 'theBoolean',
      });

      expect(type?.getText()).toMatchInlineSnapshot(`"boolean"`);
    });

    test('should find number type', async () => {
      const type = await findInitializerServiceType(project, '/tmp/test.ts', {
        serviceName: 'theNumber',
      });

      expect(type?.getText()).toMatchInlineSnapshot(`"number"`);
    });

    test('should find const string type', async () => {
      const type = await findInitializerServiceType(project, '/tmp/test.ts', {
        serviceName: 'theConstString',
      });

      expect(type?.getText()).toMatchInlineSnapshot(`""a_const_string""`);
    });

    // TODO: Find a way to create an ImportType here
    test.skip('should find const string in a type', async () => {
      const type = await findInitializerServiceType(project, '/tmp/test.ts', {
        serviceName: 'theConstStringInAType',
      });

      expect(type?.getText()).toMatchInlineSnapshot(
        `"import("/tmp/test").ConstStringInAType"`,
      );
    });

    test('should find const boolean type', async () => {
      const type = await findInitializerServiceType(project, '/tmp/test.ts', {
        serviceName: 'theConstBoolean',
      });

      expect(type?.getText()).toMatchInlineSnapshot(`"true"`);
    });

    test('should find any type', async () => {
      const type = await findInitializerServiceType(project, '/tmp/test.ts', {
        serviceName: 'ofAny',
      });

      expect(type?.getText()).toMatchInlineSnapshot(`"any"`);
    });

    test('should find unknown type', async () => {
      const type = await findInitializerServiceType(project, '/tmp/test.ts', {
        serviceName: 'ofUnknown',
      });

      expect(type?.getText()).toMatchInlineSnapshot(`"unknown"`);
    });

    test('should find null type', async () => {
      const type = await findInitializerServiceType(project, '/tmp/test.ts', {
        serviceName: 'ofNull',
      });

      expect(type?.getText()).toMatchInlineSnapshot(`"null"`);
    });

    test('should find undefined type', async () => {
      const type = await findInitializerServiceType(project, '/tmp/test.ts', {
        serviceName: 'ofUndefined',
      });

      expect(type?.getText()).toMatchInlineSnapshot(`"undefined"`);
    });

    test('should find const never type', async () => {
      const type = await findInitializerServiceType(project, '/tmp/test.ts', {
        serviceName: 'ofNever',
      });

      expect(type?.getText()).toMatchInlineSnapshot(`"never"`);
    });

    test('should find const void type', async () => {
      const type = await findInitializerServiceType(project, '/tmp/test.ts', {
        serviceName: 'ofVoid',
      });

      expect(type?.getText()).toMatchInlineSnapshot(`"void"`);
    });

    test('should find a service type', async () => {
      const type = await findInitializerServiceType(project, '/tmp/test.ts', {
        serviceName: 'myTypeService',
      });

      expect(type?.getText()).toMatchInlineSnapshot(
        `"import("/tmp/test").MyTypeService"`,
      );
    });

    test('should find a service interface', async () => {
      const type = await findInitializerServiceType(project, '/tmp/test.ts', {
        serviceName: 'myInterfaceService',
      });

      expect(type?.getText()).toMatchInlineSnapshot(
        `"import("/tmp/test").MyInterfaceService"`,
      );
    });

    test('should find a default service interface', async () => {
      const type = await findInitializerServiceType(project, '/tmp/test.ts', {
        exportName: 'default',
      });

      expect(type?.getText()).toMatchInlineSnapshot(
        `"import("/tmp/test").MyInterfaceService"`,
      );
    });
  });

  describe('with types from other files', () => {
    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        allowJs: true,
        declaration: true,
        moduleResolution: 99,
      },
    });

    project.createSourceFile(
      '/tmp/source1.ts',
      `
export type MyTypeService1 = 'my_type_service1' & {
  __tag?: 'test';
};
export async function initMyTypeService1(): Promise<MyTypeService1> {
  return 'my_type_service1';
}

export class Class1 {
  pop: true
}

  `,
    );

    project.createSourceFile(
      '/tmp/source2.ts',
      `
export type MyTypeService = 'my_type_service' & {
  __tag?: 'test';
};
export async function initMyTypeService(): Promise<MyTypeService> {
  return 'my_type_service';
}

export interface MyInterfaceService {
  srv: 'my_interface_service';
}

export async function initMyInterfaceService(): Promise<MyInterfaceService> {
  return { srv: 'my_interface_service' };
}

function location<T>(t: T, s: string):T {
  return t;
};

export interface MyDefaultInterfaceService {
  srv: 'my_interface_service';
}

async function initMyDefaultInterfaceService(): Promise<MyDefaultInterfaceService> {
  return { srv: 'my_default_interface_service' };
}

export class Class2 {
  pip: true
}

export default location(initMyDefaultInterfaceService, import.meta.url);
`,
    );
    project.createSourceFile(
      '/tmp/test.ts',
      `
import import initMyDefaultInterfaceService , {
  initMyInterfaceService
} from './source2.ts';

export * from './source1.ts';
export { initMyTypeService } from './source2.ts';

export { initMyInterfaceService };

export { initMyDefaultInterfaceService };

`,
    );

    test('should find a directly exported type', async () => {
      const type = await findInitializerServiceType(project, '/tmp/test.ts', {
        serviceName: 'myTypeService1',
      });

      expect(type?.getText()).toMatchInlineSnapshot(
        `"import("/tmp/source1").MyTypeService1"`,
      );
    });

    test('should find a reexported type', async () => {
      const type = await findInitializerServiceType(project, '/tmp/test.ts', {
        serviceName: 'myTypeService',
      });

      expect(type?.getText()).toMatchInlineSnapshot(
        `"import("/tmp/source2").MyTypeService"`,
      );
    });

    test('should find a reexported interface', async () => {
      const type = await findInitializerServiceType(project, '/tmp/test.ts', {
        serviceName: 'myInterfaceService',
      });

      expect(type?.getText()).toMatchInlineSnapshot(
        `"import("/tmp/source2").MyInterfaceService"`,
      );
    });

    test('should find a reexported default interface', async () => {
      const type = await findInitializerServiceType(project, '/tmp/test.ts', {
        serviceName: 'myDefaultInterfaceService',
      });

      expect(type?.getText()).toMatchInlineSnapshot(
        `"import("/tmp/source2").MyDefaultInterfaceService"`,
      );
    });
  });

  // TODO: Find a way to test that part
  describe.skip('with types from other modules', () => {
    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        allowJs: true,
        declaration: true,
        moduleResolution: 99,
      },
    });

    project.createSourceFile(
      '/tmp/node_modules/module1/index.ts',
      `
export type MyTypeService1 = 'my_type_service1' & {
  __tag?: 'test';
};
export async function initMyTypeService1(): Promise<MyTypeService1> {
  return 'my_type_service1';
}

export class Class1 {
  pop: true
}

  `,
    );

    project.createSourceFile(
      '/tmp/node_modules/module2/index.ts',
      `
export type MyTypeService = 'my_type_service' & {
  __tag?: 'test';
};
export async function initMyTypeService(): Promise<MyTypeService> {
  return 'my_type_service';
}

export interface MyInterfaceService {
  srv: 'my_interface_service';
}

export async function initMyInterfaceService(): Promise<MyInterfaceService> {
  return { srv: 'my_interface_service' };
}

function location<T>(t: T, s: string):T {
  return t;
};

export interface MyDefaultInterfaceService {
  srv: 'my_interface_service';
}

async function initMyDefaultInterfaceService(): Promise<MyDefaultInterfaceService> {
  return { srv: 'my_default_interface_service' };
}

export class Class2 {
  pip: true
}

export default location(initMyDefaultInterfaceService, import.meta.url);
`,
    );
    project.createSourceFile(
      '/tmp/test.ts',
      `
import import initMyDefaultInterfaceService , {
  initMyInterfaceService
} from 'module2';

export * from 'module1';
export { initMyTypeService } from 'module2';

export { initMyInterfaceService };

export { initMyDefaultInterfaceService };

`,
    );

    test('should find a directly exported type', async () => {
      const type = await findInitializerServiceType(project, '/tmp/test.ts', {
        serviceName: 'myTypeService1',
      });

      expect(type?.getText()).toMatchInlineSnapshot(`
       {
         "name": "MyTypeService1",
         "path": "/tmp/test.ts",
         "type": "alias",
       }
      `);
    });

    test('should find a reexported type', async () => {
      const type = await findInitializerServiceType(project, '/tmp/test.ts', {
        serviceName: 'myTypeService',
      });

      expect(type?.getText()).toMatchInlineSnapshot(`
       {
         "name": "MyTypeService",
         "path": "/tmp/test.ts",
         "type": "alias",
       }
      `);
    });

    test('should find a reexported interface', async () => {
      const type = await findInitializerServiceType(project, '/tmp/test.ts', {
        serviceName: 'myInterfaceService',
      });

      expect(type?.getText()).toMatchInlineSnapshot(`
       {
         "name": "MyInterfaceService",
         "path": "/tmp/source2.ts",
         "type": "alias",
       }
      `);
    });

    test('should find a reexported default interface', async () => {
      const type = await findInitializerServiceType(project, '/tmp/test.ts', {
        serviceName: 'myDefaultInterfaceService',
      });

      expect(type?.getText()).toMatchInlineSnapshot(`
       {
         "name": "MyDefaultInterfaceService",
         "path": "/tmp/source2.ts",
         "type": "alias",
       }
      `);
    });
  });
});
