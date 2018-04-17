import * as ts from "typescript";
import { CExpression } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";
import { HeaderRegistry } from "nativejs-compiler";
import { IScope } from "nativejs-compiler";
import { MillisHeaderType } from "../headers/millis";
import { Plugin } from "nativejs-compiler";
import { TypeRegistry, NumberVarType } from "nativejs-compiler";

@CodeTemplate(`millis()`)
class MillisTemplate {
  constructor() {
    HeaderRegistry.declareDependency(MillisHeaderType);
  }
}

export class MillisPlugin implements Plugin {
  execute(scope: IScope, node: ts.Node, handler: Object): CExpression {
    const call = <ts.CallExpression>node;

    return new MillisTemplate();
  }

  processTypes(node: ts.Node) {
    const call = <ts.CallExpression>node;

    TypeRegistry.declareNodeType(call, NumberVarType);
  }

  matchesNode(node: ts.Node): boolean {
    if (node.kind != ts.SyntaxKind.CallExpression) {
      return false;
    }

    const call = <ts.CallExpression>node;

    return call.expression.getText() == "millis";
  }
}
