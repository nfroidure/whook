import {
  type Type,
  type ExportAssignment,
  type ExportedDeclarations,
  Node,
  Project,
} from 'ts-morph';
import { parseName } from 'knifecycle';
import createDebug from 'debug';

const debug = createDebug('whook:types');

export async function findInitializerServiceType(
  project: Project,
  path: string,
  { serviceName, exportName }: { serviceName?: string; exportName?: string } = {
    exportName: 'default',
  },
): Promise<Type | undefined> {
  const sourceFile = project.addSourceFileAtPath(path);
  const fileExportDeclarations = sourceFile.getExportedDeclarations();
  const fileExportAssignments = sourceFile.getExportAssignments();
  const candidateExportNames: string[] = [];

  for (const [key] of fileExportDeclarations) {
    if (
      (serviceName && parseName(key) === serviceName) ||
      (exportName && exportName === key)
    ) {
      candidateExportNames.push(key);
    }
  }

  if (
    exportName === 'default' &&
    fileExportAssignments.length &&
    !candidateExportNames.includes('default')
  ) {
    candidateExportNames.push('default');
  }

  debug(
    '# Candidate export names: ',
    candidateExportNames.length ? candidateExportNames.join(', ') : '<none>',
  );

  for (const candidateExportName of candidateExportNames) {
    debug(`## Testing candidate export name: ${candidateExportName}`);
    debug(
      `## Testing candidate export name: ${[...fileExportDeclarations.keys()]}`,
    );
    debug(
      `## Testing candidate export name: ${fileExportDeclarations.get(candidateExportName)}`,
    );

    const exportedDeclarations = (
      (fileExportDeclarations.get(candidateExportName) || []) as (
        | ExportAssignment
        | ExportedDeclarations
      )[]
    ).concat(
      candidateExportName === 'default' && fileExportAssignments.length
        ? [...fileExportAssignments].flat()
        : [],
    );

    if (!exportedDeclarations.length) {
      debug(`- no export found with that name: ${candidateExportName}`);
      continue;
    }

    for (let declaration of exportedDeclarations) {
      let serviceType: Type | undefined;

      debug(`- pick export assignment: ${declaration.getText()}`);

      if (Node.isExportAssignment(declaration)) {
        debug(
          `- unwrap export assignment expression: ${declaration.getText()}`,
        );
        declaration = declaration.getExpression();
      }

      while (Node.isAsExpression(declaration)) {
        debug(`- unwrap as expression: ${declaration.getText()}`);
        declaration = declaration.getExpression();
      }

      if (
        Node.isClassDeclaration(declaration) ||
        Node.isEnumDeclaration(declaration) ||
        Node.isTypeAliasDeclaration(declaration) ||
        Node.isInterfaceDeclaration(declaration) ||
        Node.isModuleDeclaration(declaration) ||
        Node.isSourceFile(declaration)
      ) {
        debug(
          `- skip unsupported declaration assignment: ${declaration.print()}
ClassDeclaration: ${Node.isClassDeclaration(declaration)} ||
EnumDeclaration: ${Node.isEnumDeclaration(declaration)} ||
TypeAliasDeclaration: ${Node.isTypeAliasDeclaration(declaration)} ||
InterfaceDeclaration: ${Node.isInterfaceDeclaration(declaration)} ||
ModuleDeclaration: ${Node.isModuleDeclaration(declaration)} ||
SourceFile: ${Node.isSourceFile(declaration)} ||
         `,
        );
        continue;
      }

      if (Node.isFunctionDeclaration(declaration)) {
        debug(`- export is a function declaration`);
        serviceType = unwrapServiceType(declaration.getReturnType());
      } else if (Node.isCallExpression(declaration)) {
        debug(`- export is a call expression`);
        const type = declaration.getType();
        const signatures = type.getCallSignatures();

        if (!signatures.length) {
          debug(`- no call signature`, type.getText());
          continue;
        }

        for (const signature of signatures) {
          const returnType = signature.getReturnType();

          debug(`- call signature`, returnType.getText());
          serviceType = unwrapServiceType(returnType);
          if (serviceType) {
            break;
          }
        }
      } else if (Node.isVariableDeclaration(declaration)) {
        debug(`- export is a variable`);
        const type = declaration.getType();
        const signatures = type.getCallSignatures();

        if (!signatures.length) {
          debug(`- no call signature`, declaration.getText(), type.getText());
          continue;
        }

        for (const signature of signatures) {
          const returnType = signature.getReturnType();

          debug(`- call signature`, returnType.getText());
          serviceType = unwrapServiceType(returnType);
          if (serviceType) {
            break;
          }
        }
      }

      if (!serviceType) {
        debug(
          `- no usable type found: ${declaration.getText()} ${serviceType}`,
        );
        continue;
      }
      debug(`- found a service type`, serviceType.getText());

      if (!serviceType.isAny() && !serviceType.isNever()) {
        for (const [name, declarations] of fileExportDeclarations) {
          if (name === 'default') {
            continue;
          }

          const declaration = declarations.find(
            (value) =>
              serviceType && serviceType.isAssignableTo(value.getType()),
          );

          if (declaration) {
            serviceType = declaration ? declaration.getType() : serviceType;

            debug(
              `- type is assignable to an export: ${name}, ${declaration.getText()}`,
            );

            return serviceType;
          }
        }
      }
      return serviceType;
    }
  }

  return;
}

function unwrapServiceType(type: Type): Type | undefined {
  let currentType = type.getAwaitedType();

  if (currentType) {
    const serviceProperty = currentType.getProperty('service');

    if (serviceProperty) {
      const node = serviceProperty.getValueDeclaration();

      if (node) {
        currentType = serviceProperty.getTypeAtLocation(node);
      }
    }
  }

  return currentType;
}

export async function findConfigServiceType(
  project: Project,
  projectPath: string,
  configKey: string,
): Promise<Type | undefined> {
  debug(`# Reading project module augmentations`);

  const sourceFile = project.addSourceFileAtPath(
    `${projectPath}/src/whook.d.ts`,
  );
  const moduleAugmentations = sourceFile.getModules();
  let configType: Type | undefined = undefined;

  for (const moduleAugmentation of moduleAugmentations) {
    if (configType) {
      break;
    }

    const moduleAugmentationName = moduleAugmentation.getName();

    debug(`# Found augmentation for: ${moduleAugmentationName}`);
    if (moduleAugmentationName !== "'application-services'") {
      debug(`- skipping: ${moduleAugmentationName}`);
      continue;
    }

    debug(`- reading interfaces for: ${moduleAugmentationName}`);
    const internalInterfaces = moduleAugmentation.getInterfaces();

    for (const internalInterface of internalInterfaces) {
      if (configType) {
        break;
      }
      const internalInterfaceName = internalInterface.getName();

      debug(`- testing interface: ${internalInterfaceName}`);
      if (internalInterfaceName !== 'AppConfig') {
        debug(`- skipping: ${internalInterfaceName}`);
        continue;
      }

      debug(
        '- reading properties',
        internalInterface.getProperties().map((p) => p.getName()),
      );

      const configProperty = internalInterface.getProperty(configKey);

      if (configProperty) {
        debug(`- property exists: ${configKey}`);
        configType = configProperty.getType().getNonNullableType();
        break;
      }

      const extendsExpressions = internalInterface.getExtends();

      for (const extendsExpression of extendsExpressions) {
        if (configType) {
          break;
        }
        const expression = extendsExpression.getExpression();

        if (!Node.isIdentifier(expression)) {
          debug(`- skipping extend: ${expression.getText()}`);
          break;
        }

        debug(`- analyzing extend: ${expression.getText()}`);

        for (const definition of expression.getDefinitionNodes()) {
          if (configType) {
            break;
          }

          if (Node.isInterfaceDeclaration(definition)) {
            debug(
              '- reading properties',
              definition.getProperties().map((p) => p.getName()),
            );

            const configProperty = definition.getProperty(configKey);

            if (configProperty) {
              debug(`- property exists: ${configKey}`);
              configType = configProperty.getType().getNonNullableType();
              break;
            }
          }
        }
      }
    }
  }

  if (configType) {
    debug(`# Type found: ${configType.getText()}`);
    return configType;
  }

  return;
}
