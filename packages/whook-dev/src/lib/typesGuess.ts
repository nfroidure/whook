import {
  type ExportAssignment,
  type ExportedDeclarations,
  type SourceFile,
  type CallSignatureDeclaration,
  type FunctionLikeDeclaration,
  type FunctionTypeNode,
  Node,
  Project,
} from 'ts-morph';
import { parseName } from 'knifecycle';
import createDebug from 'debug';

const debug = createDebug('whook:types');

export async function findInitializerServiceTypeNode(
  sourceFile: SourceFile,
  { serviceName, exportName }: { serviceName?: string; exportName?: string } = {
    exportName: 'default',
  },
): Promise<Node | undefined> {
  const fileExportDeclarations = sourceFile.getExportedDeclarations();
  const baseExportDeclarations = sourceFile.getExportDeclarations();
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

    for (const declaration of exportedDeclarations) {
      if (
        Node.isClassDeclaration(declaration) ||
        Node.isEnumDeclaration(declaration) ||
        Node.isTypeAliasDeclaration(declaration) ||
        Node.isInterfaceDeclaration(declaration) ||
        Node.isModuleDeclaration(declaration) ||
        Node.isSourceFile(declaration)
      ) {
        debug(
          `- skip unusable declaration assignment: ${declaration.print()}
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

      let serviceTypeNode: Node | undefined;
      let currentNode: Node | undefined = declaration;

      debug(`- pick export assignment: ${currentNode.getText()}`);

      if (Node.isExportAssignment(currentNode)) {
        currentNode = currentNode.getExpression();
        debug(
          `- unwrap export assignment expression: ${currentNode.getText()}`,
        );
      }
      if (Node.isVariableDeclaration(currentNode)) {
        const typeNode = currentNode.getTypeNode();
        const initializerNode = currentNode.getInitializer();

        if (typeNode) {
          currentNode = typeNode;
          debug(
            `- unwrap variable declaration type node: ${currentNode.getText()}`,
          );
        } else if (initializerNode) {
          currentNode = initializerNode;
          debug(
            `- unwrap variable declaration type node: ${initializerNode.getText()}`,
          );
        }
      }

      while (Node.isAsExpression(currentNode)) {
        debug(`- unwrap as expression: ${currentNode.getText()}`);
        currentNode = currentNode.getExpression();
      }

      if (currentNode) {
        currentNode = unwrapKnifecycleUtilsCalls(currentNode);
      }

      if (Node.isTypeNode(currentNode)) {
        debug(`- unwrap a type: ${currentNode.getText()}`);

        if (Node.isTypeReference(currentNode)) {
          debug(`- node is a type reference`);
          const typeName = currentNode.getTypeName();

          if (Node.isIdentifier(typeName)) {
            debug(`- node has an identifier`);
            for (const definitionNode of typeName.getDefinitionNodes()) {
              debug(`- node definition: ${definitionNode.getText()}`);
              if (Node.isTypeAliasDeclaration(definitionNode)) {
                currentNode = definitionNode.getTypeNode();

                debug(`- type declaration: ${currentNode?.getText()}`);
              } else if (Node.isInterfaceDeclaration(definitionNode)) {
                debug(`- interface declaration: ${definitionNode?.getText()}`);
                const members = definitionNode.getMembers();

                for (const member of members) {
                  if (Node.isCallSignatureDeclaration(member)) {
                    debug(`- call signature: ${member.getText()}`);
                    currentNode = member;
                  }
                }
              }
              break;
            }
          }
        }
      }

      if (
        Node.isFunctionDeclaration(currentNode) ||
        Node.isFunctionExpression(currentNode) ||
        Node.isFunctionLikeDeclaration(currentNode) ||
        Node.isFunctionTypeNode(currentNode) ||
        Node.isCallSignatureDeclaration(currentNode)
      ) {
        debug(`- export is a function declaration/expression`);
        serviceTypeNode = unwrapInitializerServiceTypeNode(currentNode);
      }

      if (!serviceTypeNode) {
        debug(`- no usable type found: ${declaration.getText()}`);
        continue;
      }
      debug(`- found a service type node`, serviceTypeNode.getText());

      // const serviceType = serviceTypeNode.getType();

      // if (!serviceType.isAny() && !serviceType.isNever()) {
      //   for (const [name, declarations] of fileExportDeclarations) {
      //     if (name === 'default') {
      //       continue;
      //     }

      //     const declaration = declarations.find(
      //       (value) =>
      //         serviceType && serviceType.isAssignableTo(value.getType()),
      //     );

      //     if (declaration) {
      //       debug(
      //         `- type is assignable to an export: ${name}, ${declaration.getText()}`,
      //       );

      //       return declaration;
      //     }
      //   }
      // }

      return serviceTypeNode;
    }
  }

  for (const exportDeclaration of baseExportDeclarations) {
    if (
      !exportDeclaration.isTypeOnly() &&
      !exportDeclaration.hasNamedExports()
    ) {
      debug(
        `- looking in raw export declarations`,
        exportDeclaration.getText(),
      );
      const moduleSpecifierSourceFile =
        exportDeclaration.getModuleSpecifierSourceFile();

      if (moduleSpecifierSourceFile) {
        debug(`- new file`, moduleSpecifierSourceFile.getFilePath());
        const serviceTypeNode = await findInitializerServiceTypeNode(
          moduleSpecifierSourceFile,
          { serviceName, exportName },
        );

        if (serviceTypeNode) {
          return serviceTypeNode;
        }
      }
    }
  }

  return;
}

function unwrapKnifecycleUtilsCalls(node: Node): Node | undefined {
  debug('- trying to unwrap Knifecycle utils calls');

  if (Node.isCallExpression(node)) {
    const functionName = node.getExpression().getText();
    const callArguments = node.getArguments();

    debug(`- attempting to unwrap call argument of "${functionName}"`);

    if (['constant'].includes(functionName)) {
      if (callArguments[1]) {
        debug(`- unwrapped "${callArguments[1].getText()}"`);
        return callArguments[1];
      }

      return node;
    }

    if (
      [
        'location',
        'service',
        'autoService',
        'provider',
        'autoProvider',
        'autoInject',
        'singleton',
        'autoName',
      ].includes(functionName)
    ) {
      if (callArguments[0]) {
        debug(`Unwrapped "${callArguments[0].getText()}"`);

        if (Node.isIdentifier(callArguments[0])) {
          debug(`- argument is an identifier`);
          const definitionNodes = callArguments[0].getDefinitionNodes();

          debug(`- returning its definition: ${definitionNodes[0].getText()}`);
          return definitionNodes[0];
        }

        return unwrapKnifecycleUtilsCalls(callArguments[0]);
      }

      return node;
    }
    if (
      [
        'inject',
        'unInject',
        'useInject',
        'mergeInject',
        'alsoInject',
        'extra',
        'name',
        'type',
        'initializer',
        'wrapInitializer',
      ].includes(functionName)
    ) {
      if (callArguments[1]) {
        debug(`- unwrapped "${callArguments[1].getText()}"`);

        if (Node.isIdentifier(callArguments[1])) {
          debug(`- argument is an identifier`);
          const definitionNodes = callArguments[1].getDefinitionNodes();

          debug(`- returning its definition: ${definitionNodes[0].getText()}`);
          return definitionNodes[0];
        }

        return unwrapKnifecycleUtilsCalls(callArguments[1]);
      }

      return node;
    }
  }
  return node;
}

function unwrapInitializerServiceTypeNode(
  typeNode:
    | FunctionLikeDeclaration
    | CallSignatureDeclaration
    | FunctionTypeNode,
): Node | undefined {
  const returnTypeNode = typeNode.getReturnTypeNode();

  if (returnTypeNode) {
    debug(`- return type node: ${returnTypeNode.getText()}`);

    if (
      !Node.isTypeReference(returnTypeNode) ||
      returnTypeNode.getTypeName()?.getText() !== 'Promise'
    ) {
      return;
    }

    const serviceTypeNode = returnTypeNode.getTypeArguments()[0];

    const type = serviceTypeNode.getType();
    const serviceProperty = type.getProperty('service');

    if (!serviceProperty) {
      return serviceTypeNode;
    }

    const node = serviceProperty.getValueDeclaration();

    if (!node) {
      return;
    }

    return node;
  }

  debug(`- could not find the return type node, try guessing awaited type`);
  const returnType = typeNode.getReturnType();
  const currentType = returnType.getAwaitedType();

  if (!currentType) {
    debug(`- could not find the awaited return type`);
    return;
  }

  debug(`- awaited return type: ${currentType.getText()}`);

  const serviceProperty = currentType.getProperty('service');

  if (serviceProperty) {
    debug(`- found service type property`);
    return serviceProperty.getValueDeclaration();
  }

  const typeName = currentType.getAliasSymbol() || currentType.getSymbol();

  if (typeName) {
    debug(`- found alias symbol: ${typeName.getName()}`);
    const valueDeclaration = typeName.getValueDeclaration();

    if (valueDeclaration) {
      debug(`- found value declaration: ${valueDeclaration.getText()}`);

      return valueDeclaration;
    }
  }

  debug(`- could not find alias symbol`);
}

export async function findConfigServiceType(
  project: Project,
  projectPath: string,
  propertyName: string,
): Promise<Node | undefined> {
  debug(`# Reading project module augmentations`);

  const sourceFile = project.addSourceFileAtPath(
    `${projectPath}/src/whook.d.ts`,
  );
  const moduleAugmentations = sourceFile.getModules();
  let typeNode: Node | undefined = undefined;

  for (const moduleAugmentation of moduleAugmentations) {
    if (typeNode) {
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
      if (typeNode) {
        break;
      }
      const internalInterfaceName = internalInterface.getName();

      debug(`- testing interface: ${internalInterfaceName}`);
      if (internalInterfaceName !== 'AppConfig') {
        debug(`- skipping: ${internalInterfaceName}`);
        continue;
      }

      typeNode = await recursivelyLookupTypeNodeForProperty(
        internalInterface,
        propertyName,
      );
    }
  }

  if (typeNode) {
    debug(`# Type found: ${typeNode.getText()}`);
    return typeNode;
  }

  return;
}

export async function recursivelyLookupTypeNodeForProperty(
  currentNode: Node,
  propretyName: string,
): Promise<Node | undefined> {
  if (Node.isIntersectionTypeNode(currentNode)) {
    debug(`- node is an intersection type`);
    for (const intersectionNode of currentNode.getTypeNodes()) {
      debug(`- check intersection node ${intersectionNode.getText()}`);
      const candidateType = await recursivelyLookupTypeNodeForProperty(
        intersectionNode,
        propretyName,
      );

      if (candidateType) {
        return candidateType;
      }
    }
  }

  if (Node.isTypeReference(currentNode)) {
    debug(`- node is a type reference`);
    const typeName = currentNode.getTypeName();

    if (Node.isIdentifier(typeName)) {
      debug(`- node has an identifier`);
      for (const definitionNode of typeName.getDefinitionNodes()) {
        debug(`- node definition: ${definitionNode.getText()}`);
        const candidateType = await recursivelyLookupTypeNodeForProperty(
          definitionNode,
          propretyName,
        );

        if (candidateType) {
          return candidateType;
        }
      }
    }
  }

  if (Node.isInterfaceDeclaration(currentNode)) {
    debug(`- node is an interface declaration`);
    debug(
      '- reading properties',
      currentNode.getProperties().map((p) => p.getName()),
    );

    const configProperty = currentNode.getProperty(propretyName);

    if (configProperty) {
      debug(`- property exists: ${propretyName}`);
      return configProperty.getTypeNode();
    }

    const extendsExpressions = currentNode.getExtends();

    for (const extendsExpression of extendsExpressions) {
      const expression = extendsExpression.getExpression();

      // TODO: Check alternatives
      if (!Node.isIdentifier(expression)) {
        debug(`- skipping extend: ${expression.getText()}`);
        break;
      }

      debug(`- analyzing extend: ${expression.getText()}`);
      for (const definitionNode of expression.getDefinitionNodes()) {
        debug(`- node definition: ${definitionNode.getText()}`);
        const candidateType = await recursivelyLookupTypeNodeForProperty(
          definitionNode,
          propretyName,
        );

        if (candidateType) {
          return candidateType;
        }
      }
    }
  }

  if (Node.isTypeAliasDeclaration(currentNode)) {
    debug(`- node is a type alias declaration`);

    const typeNode = currentNode.getTypeNode();

    if (typeNode) {
      if (Node.isTypeLiteral(typeNode)) {
        const configProperty = typeNode.getProperty(propretyName);

        if (configProperty) {
          debug(`- property exists: ${propretyName}`);
          return configProperty.getTypeNode();
        }
      }

      const candidateType = await recursivelyLookupTypeNodeForProperty(
        typeNode,
        propretyName,
      );

      if (candidateType) {
        return candidateType;
      }
    }
  }
}
