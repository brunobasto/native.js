import * as ts from "typescript";
import { CExpression } from "nativejs-compiler";
import { TypeRegistry, IntegerType } from "nativejs-compiler";
import { CodeTemplate, CodeTemplateFactory } from "nativejs-compiler";
import { HeaderRegistry } from "nativejs-compiler";
import { IScope } from "nativejs-compiler";
import { Plugin } from "nativejs-compiler";
import { AdcHeaderType } from "../headers/adc";

@CodeTemplate(`ADCsingleREAD({arguments})`)
class AnalogReadTemplate {
  public arguments: any[] = [];

  constructor(scope: IScope, node: ts.Node) {
    const call = <ts.CallExpression>node;

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
  execute(scope: IScope, node: ts.Node, handler: Object): CExpression {
    const call = <ts.CallExpression>node;

    return new AnalogReadTemplate(scope, call);
  }

  processTypes(node: ts.Node) {
    const call = <ts.CallExpression>node;

    TypeRegistry.declareNodeType(call, IntegerType);
  }

  matchesNode(node: ts.Node): boolean {
    if (node.kind != ts.SyntaxKind.CallExpression) {
      return false;
    }

    const call = <ts.CallExpression>node;

    return (
      call.expression.kind == ts.SyntaxKind.PropertyAccessExpression &&
      call.expression.getText() == "Analog.read"
    );
  }
}
