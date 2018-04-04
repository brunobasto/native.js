import { IScope, CProgram } from "../program";
import { StandardCallHelper } from "../resolver";
import { CodeTemplate, CodeTemplateFactory } from "../template";
import { CExpression } from "./expressions";
import * as ts from "typescript";
import { CFunction, CFunctionPrototype } from "./function";
import { PluginRegistry } from "../core/plugin";
import { HeaderRegistry, Int16HeaderType } from "../core/header";

@CodeTemplate(`
{#if pluginExpression}
    {pluginExpression}
{#elseif standardCall}
    {standardCall}
{#else}
    {funcName}({arguments {, }=> {this}})
{/if}`,
  ts.SyntaxKind.CallExpression
)
export class CCallExpression {
  public arguments: CExpression[];
  public funcName: string;
  public pluginExpression: CExpression;
  public standardCall: CExpression;

  constructor(scope: IScope, call: ts.CallExpression) {
    this.funcName = call.expression.getText();

    this.pluginExpression = PluginRegistry.executePlugins(scope, call, this);

    if (this.pluginExpression) {
      return;
    }

    this.standardCall = StandardCallHelper.createTemplate(scope, call);

    if (this.standardCall) {
      return;
    }

    this.arguments = call.arguments.map(a => {
      return CodeTemplateFactory.createForNode(scope, a);
    });

    if (
      call.expression.kind == ts.SyntaxKind.Identifier &&
      this.funcName == "parseInt"
    ) {
      HeaderRegistry.declareDependency(Int16HeaderType);
      scope.root.headerFlags.parseInt = true;
    }
  }
}

@CodeTemplate(`{name}`, ts.SyntaxKind.FunctionExpression)
export class CFunctionExpression {
  public name: string;

  constructor(scope: IScope, expression: ts.FunctionExpression) {
    const dynamicFunction = new CFunction(scope.root, expression);
    scope.root.functions.push(dynamicFunction);
    this.name = dynamicFunction.name;
  }
}
