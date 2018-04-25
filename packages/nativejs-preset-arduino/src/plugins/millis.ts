import { INativeExpression } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";
import { HeaderRegistry } from "nativejs-compiler";
import { IScope } from "nativejs-compiler";
import { Plugin } from "nativejs-compiler";
import { IntegerType, TypeRegistry } from "nativejs-compiler";
import * as ts from "typescript";
import { MillisHeaderType } from "../headers/millis";

@CodeTemplate(`millis()`)
class MillisTemplate {
  constructor() {
    HeaderRegistry.declareDependency(MillisHeaderType);
  }
}

export class MillisPlugin implements Plugin {
  public execute(scope: IScope, node: ts.Node): INativeExpression {
    const call = node as ts.CallExpression;

    return new MillisTemplate();
  }

  public processTypes(node: ts.Node) {
    const call = node as ts.CallExpression;

    TypeRegistry.declareNodeType(call, IntegerType);
  }

  public matchesNode(node: ts.Node): boolean {
    if (node.kind !== ts.SyntaxKind.CallExpression) {
      return false;
    }

    const call = node as ts.CallExpression;

    return call.expression.getText() === "millis";
  }
}
