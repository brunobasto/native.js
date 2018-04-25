import { CProgram } from "nativejs-compiler";
import { CVariable } from "nativejs-compiler";
import { CodeTemplate, CodeTemplateFactory } from "nativejs-compiler";
import { HeaderRegistry } from "nativejs-compiler";
import { IScope } from "nativejs-compiler";
import { INativeExpression } from "nativejs-compiler";
import { Plugin } from "nativejs-compiler";
import { TypeRegistry } from "nativejs-compiler";
import { CFunction } from "nativejs-compiler";
import * as ts from "typescript";
import { Timer1OverflowBottom } from "../bottoms/bottom-timer1-overflow";
import { MillisHeaderType } from "../headers/millis";

@CodeTemplate(``)
class SetIntervalTemplate {
  constructor(scope: IScope, node: ts.Node) {
    const call = node as ts.CallExpression;
    if (call.arguments.length < 2) {
      throw new Error(
        "setInterval([function], [interval]) needs two arguments."
      );
    }
    const intervalName = scope.root.gc.getUniqueName();
    scope.root.variables.push(
      new CVariable(scope, intervalName, "unsigned long", {
        initializer: "0"
      })
    );
    const callback = new CFunction(scope.root, call
      .arguments[0] as ts.FunctionExpression);
    scope.root.functions.push(callback);
    const intervalArgument = CodeTemplateFactory.createForNode(
      scope,
      call.arguments[1]
    );
    const interval = intervalArgument.resolve();
    Timer1OverflowBottom.statements.push(`
    if (timer1_millis - ${intervalName} > ${interval}) {
      ${callback.name}();
      ${intervalName} = timer1_millis;
    }`);
    HeaderRegistry.declareDependency(MillisHeaderType);
  }
}

export class SetIntervalPlugin implements Plugin {
  public execute(scope: IScope, node: ts.Node): INativeExpression {
    const call = node as ts.CallExpression;

    return new SetIntervalTemplate(scope, node);
  }

  public processTypes(node: ts.Node) {
    TypeRegistry.declareNodeType(node, "void");
  }

  public matchesNode(node: ts.Node): boolean {
    if (node.kind !== ts.SyntaxKind.CallExpression) {
      return false;
    }

    const call = node as ts.CallExpression;

    return call.expression.getText() === "setInterval";
  }
}
