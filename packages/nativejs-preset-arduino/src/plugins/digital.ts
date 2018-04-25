import * as ts from "typescript";
import { TypeRegistry, IntegerType } from "nativejs-compiler";
import { CodeTemplate, CodeTemplateFactory } from "nativejs-compiler";
import { HeaderRegistry } from "nativejs-compiler";
import { IScope } from "nativejs-compiler";
import { CExpression } from "nativejs-compiler";
import { Plugin } from "nativejs-compiler";
import { IOHeaderType } from "../headers/io";

@CodeTemplate(`
do {
  if ({value})
    PORT{port} |= (1<<P{port}{pin});
  else
    PORT{port} &= ~(1<<P{port}{pin});
} while (0);
`)
class DigitalWriteTemplate {
  public pin: string = "0";
  public port: string;
  public value: string = "1";

  constructor(scope: IScope, node: ts.Node) {
    const call = <ts.CallExpression>node;

    if (call.arguments.length < 3) {
      throw new Error("Digital.read needs 3 arguments.");
    }

    const args = call.arguments.map(a => {
      return CodeTemplateFactory.createForNode(scope, a);
    });

    this.port = args[0]
      .resolve()
      .replace(/[\"\']/g, "")
      .toUpperCase();
    this.pin = args[1].resolve();
    this.value = args[2].resolve();

    console.log(this.port, this.pin, this.value);

    HeaderRegistry.declareDependency(IOHeaderType);
  }
}

export class DigitalWritePlugin implements Plugin {
  execute(scope: IScope, node: ts.Node, handler: Object): CExpression {
    const call = <ts.CallExpression>node;

    return new DigitalWriteTemplate(scope, call);
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
      call.expression.kind === ts.SyntaxKind.PropertyAccessExpression &&
      call.expression.getText() === "Digital.write"
    );
  }
}
