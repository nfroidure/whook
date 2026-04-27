import { describe, test, expect } from '@jest/globals';
import { findInitializerServiceTypeNode } from './typesGuess.js';
import { Project } from 'ts-morph';

describe('findInitializerServiceTypeNode', () => {
  describe('with simple types', () => {
    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        allowJs: true,
        declaration: true,
        moduleResolution: 99,
      },
    });
    const sourceFile = project.createSourceFile(
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

export interface AnotherInterfaceService {
  srv: 'another_interface_service';
}

export const initAnotherInterfaceService =
  async function initAnotherInterfaceService(): Promise<AnotherInterfaceService> {
    return { srv: 'another_interface_service' };
  };

export interface YetAnotherInterfaceService {
  srv: 'yet_another_interface_service';
}

export type YetAnotherInterfaceServiceInitializer =
  () => Promise<YetAnotherInterfaceService>;

export const initYetAnotherInterfaceService: YetAnotherInterfaceServiceInitializer =
  async function initYetAnotherInterfaceService(): Promise<YetAnotherInterfaceService> {
    return { srv: 'yet_another_interface_service' };
  };

export interface TilAnotherInterfaceService {
  srv: 'til_another_interface_service';
}

export interface TilAnotherInterfaceServiceInitializer {
  (): Promise<TilAnotherInterfaceService>
};

export const initTilAnotherInterfaceService: TilAnotherInterfaceServiceInitializer =
  async function initTilAnotherInterfaceService(): Promise<TilAnotherInterfaceService> {
    return { srv: 'til_another_interface_service' };
  };

export async function initImplicitReturnTypeService() {
  return { srv: 'implicit_return_type_service' };
};
`,
    );

    test('should find string type', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'theString',
      });

      expect(node?.getText()).toMatchInlineSnapshot(`"string"`);
    });

    test('should find boolean type', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'theBoolean',
      });

      expect(node?.getText()).toMatchInlineSnapshot(`"boolean"`);
    });

    test('should find number type', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'theNumber',
      });

      expect(node?.getText()).toMatchInlineSnapshot(`"number"`);
    });

    test('should find const string type', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'theConstString',
      });

      expect(node?.getText()).toMatchInlineSnapshot(`"'a_const_string'"`);
    });

    test('should find const string in a type', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'theConstStringInAType',
      });

      expect(node?.getText()).toMatchInlineSnapshot(`"ConstStringInAType"`);
    });

    test('should find const boolean type', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'theConstBoolean',
      });

      expect(node?.getText()).toMatchInlineSnapshot(`"true"`);
    });

    test('should find any type', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'ofAny',
      });

      expect(node?.getText()).toMatchInlineSnapshot(`"any"`);
    });

    test('should find unknown type', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'ofUnknown',
      });

      expect(node?.getText()).toMatchInlineSnapshot(`"unknown"`);
    });

    test('should find null type', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'ofNull',
      });

      expect(node?.getText()).toMatchInlineSnapshot(`"null"`);
    });

    test('should find undefined type', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'ofUndefined',
      });

      expect(node?.getText()).toMatchInlineSnapshot(`"undefined"`);
    });

    test('should find const never type', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'ofNever',
      });

      expect(node?.getText()).toMatchInlineSnapshot(`"never"`);
    });

    test('should find const void type', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'ofVoid',
      });

      expect(node?.getText()).toMatchInlineSnapshot(`"void"`);
    });

    test('should find a service type', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'myTypeService',
      });

      expect(node?.getText()).toMatchInlineSnapshot(`"MyTypeService"`);
    });

    test('should find a service interface', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'myInterfaceService',
      });

      expect(node?.getText()).toMatchInlineSnapshot(`"MyInterfaceService"`);
    });

    test('should find a default service interface', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        exportName: 'default',
      });

      expect(node?.getText()).toMatchInlineSnapshot(
        `"MyDefaultInterfaceService"`,
      );
    });

    test('should find a variable declaration type', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'anotherInterfaceService',
      });

      expect(node?.getText()).toMatchInlineSnapshot(
        `"AnotherInterfaceService"`,
      );
    });

    test('should find a variable declaration with type node', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'yetAnotherInterfaceService',
      });

      expect(node?.getText()).toMatchInlineSnapshot(
        `"YetAnotherInterfaceService"`,
      );
    });

    test('should find a variable declaration with interface node', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'tilAnotherInterfaceService',
      });

      expect(node?.getText()).toMatchInlineSnapshot(
        `"TilAnotherInterfaceService"`,
      );
    });

    test('should find an implicit return type node', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'implicitReturnTypeService',
      });

      expect(node?.getText()).toMatchInlineSnapshot(
        `"{ srv: 'implicit_return_type_service' }"`,
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
    const sourceFile = project.createSourceFile(
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
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'myTypeService1',
      });

      expect(node?.getText()).toMatchInlineSnapshot(`"MyTypeService1"`);
    });

    test('should find a reexported type', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'myTypeService',
      });

      expect(node?.getText()).toMatchInlineSnapshot(`"MyTypeService"`);
    });

    test('should find a reexported interface', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'myInterfaceService',
      });

      expect(node?.getText()).toMatchInlineSnapshot(`"MyInterfaceService"`);
    });

    test('should find a reexported default interface', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'myDefaultInterfaceService',
      });

      expect(node?.getText()).toMatchInlineSnapshot(
        `"MyDefaultInterfaceService"`,
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
    const sourceFile = project.createSourceFile(
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
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'myTypeService1',
      });

      expect(node?.getText()).toMatchInlineSnapshot(`MyTypeService1`);
    });

    test('should find a reexported type', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'myTypeService',
      });

      expect(node?.getText()).toMatchInlineSnapshot(`MyTypeService`);
    });

    test('should find a reexported interface', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'myInterfaceService',
      });

      expect(node?.getText()).toMatchInlineSnapshot(`MyInterfaceService`);
    });

    test('should find a reexported default interface', async () => {
      const node = await findInitializerServiceTypeNode(sourceFile, {
        serviceName: 'myDefaultInterfaceService',
      });

      expect(node?.getText()).toMatchInlineSnapshot(
        `MyDefaultInterfaceService`,
      );
    });
  });
});
