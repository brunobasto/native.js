import { INativeExpression } from "nativejs-compiler";
import { CodeTemplate, CodeTemplateFactory } from "nativejs-compiler";
import { HeaderRegistry, StdioHeaderType } from "nativejs-compiler";
import { IScope } from "nativejs-compiler";
import { Plugin } from "nativejs-compiler";
import { IntegerType, TypeRegistry } from "nativejs-compiler";
import * as ts from "typescript";
import { UARTHeaderType } from "../headers/uart";

import { ConsoleLogPlugin } from "nativejs-preset-standard/src/plugins/console";

export class SerialConsoleLogPlugin extends ConsoleLogPlugin {
  public execute(scope: IScope, node: ts.Node): INativeExpression {
    HeaderRegistry.declareDependency(UARTHeaderType);

    return super.execute(scope, node);
  }

  public processTypes(node: ts.Node) {
    TypeRegistry.declareNodeType(node, "void");
  }
}

@CodeTemplate(`scanf("%s", {stringArg});`)
class SerialConsoleReadTemplate {
  public stringArg: any = null;

  constructor(scope: IScope, node: ts.Node) {
    const call = node as ts.CallExpression;

    if (call.arguments.length) {
      this.stringArg = CodeTemplateFactory.createForNode(
        scope,
        call.arguments[0]
      );
    }
  }
}

export class SerialConsoleReadPlugin implements Plugin {
  public execute(scope: IScope, node: ts.Node): INativeExpression {
    const call = node as ts.CallExpression;

    HeaderRegistry.declareDependency(StdioHeaderType);

    return new SerialConsoleReadTemplate(scope, call);
  }

  public processTypes(node: ts.Node) {}

  public matchesNode(node: ts.Node): boolean {
    if (node.kind !== ts.SyntaxKind.CallExpression) {
      return false;
    }

    const call = node as ts.CallExpression;

    return call.expression.getText() === "serialRead";
  }
}
