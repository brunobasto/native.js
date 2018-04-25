import {
  CExpression,
  CodeTemplate,
  HeaderRegistry,
  IScope,
  Plugin,
  StdioHeaderType
} from "nativejs-compiler";
import * as ts from "typescript";
import { ConsoleLogHelper } from "./log";

@CodeTemplate(`
{#statements}
    {#if printfCalls.length}
        {printfCalls => {this}\n}
    {/if}
{/statements}
{#if printfCall}
    {printfCall}
{/if}`)
class ConsoleLogTemplate {
  public printfCalls: any[] = [];
  public printfCall: any = null;

  constructor(scope: IScope, node: ts.Node) {
    const call = node as ts.CallExpression;

    if (call.arguments.length) {
      const printfs = ConsoleLogHelper.create(scope, call.arguments);

      this.printfCalls = printfs.slice(0, -1);
      this.printfCall = printfs[printfs.length - 1];

      HeaderRegistry.declareDependency(StdioHeaderType);
    }
  }
}

export class ConsoleLogPlugin implements Plugin {
  public execute(scope: IScope, node: ts.Node): CExpression {
    const call = node as ts.CallExpression;

    return new ConsoleLogTemplate(scope, call);
  }

  public processTypes(node: ts.Node) {}

  public matchesNode(node: ts.Node): boolean {
    if (node.kind !== ts.SyntaxKind.CallExpression) {
      return false;
    }

    const call = node as ts.CallExpression;

    return (
      call.expression.kind === ts.SyntaxKind.PropertyAccessExpression &&
      call.expression.getText() === "console.log"
    );
  }
}
