import * as ts from "typescript";
import { HeaderRegistry, MathHeaderType } from "nativejs-compiler";
import { Plugin } from "nativejs-compiler";
import { CExpression } from "nativejs-compiler";
import { IScope } from "nativejs-compiler";
import { CodeTemplate, CodeTemplateFactory } from "nativejs-compiler";

@CodeTemplate(`log({arguments})`)
class MathLogTemplate {
  public arguments: any[] = [];

  constructor(scope: IScope, node: ts.Node) {
    const call = node as ts.CallExpression;

    HeaderRegistry.declareDependency(MathHeaderType);

    if (call.arguments.length) {
      this.arguments = call.arguments.map(a => {
        return CodeTemplateFactory.createForNode(scope, a);
      });
    }
  }
}

export class MathLogPlugin implements Plugin {
  public execute(scope: IScope, node: ts.Node, handler: Object): CExpression {
    const call = node as ts.CallExpression;

    return new MathLogTemplate(scope, call);
  }

  public processTypes(node: ts.Node) {}

  public matchesNode(node: ts.Node): boolean {
    if (node.kind != ts.SyntaxKind.CallExpression) {
      return false;
    }

    const call = node as ts.CallExpression;

    return (
      call.expression.kind == ts.SyntaxKind.PropertyAccessExpression &&
      call.expression.getText() == "Math.log"
    );
  }
}
