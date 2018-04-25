import { INativeExpression } from "nativejs-compiler";
import { IntegerType, TypeRegistry } from "nativejs-compiler";
import { CodeTemplate, CodeTemplateFactory } from "nativejs-compiler";
import { HeaderRegistry } from "nativejs-compiler";
import { IScope } from "nativejs-compiler";
import { Plugin } from "nativejs-compiler";
import * as ts from "typescript";
import { AdcHeaderType } from "../headers/adc";

@CodeTemplate(`ADCsingleREAD({arguments})`)
class AnalogReadTemplate {
  public arguments: any[] = [];

  constructor(scope: IScope, node: ts.Node) {
    const call = node as ts.CallExpression;

    if (call.arguments.length === 0) {
      throw new Error("Analog.read needs an argument.");
    }

    this.arguments = call.arguments.map(a => {
      return CodeTemplateFactory.createForNode(scope, a);
    });

    HeaderRegistry.declareDependency(AdcHeaderType);
  }
}

export class AnalogReadPlugin implements Plugin {
  public execute(scope: IScope, node: ts.Node): INativeExpression {
    const call = node as ts.CallExpression;

    return new AnalogReadTemplate(scope, call);
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

    return (
      call.expression.kind === ts.SyntaxKind.PropertyAccessExpression &&
      call.expression.getText() === "Analog.read"
    );
  }
}
