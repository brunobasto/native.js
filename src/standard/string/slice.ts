import * as ts from "typescript";
import { CElementAccess } from "../../nodes/elementaccess";
import { CExpression } from "../../nodes/expressions";
import { CVariable } from "../../nodes/variable";
import { IScope } from "../../program";
import { IResolver, StandardCallResolver } from "../../resolver";
import { CodeTemplate, CodeTemplateFactory } from "../../template";
import {
  ArrayType,
  NumberVarType,
  StringVarType,
  TypeHelper
} from "../../types";

@StandardCallResolver
class StringSliceResolver implements IResolver {
  public matchesNode(typeHelper: TypeHelper, call: ts.CallExpression) {
    if (call.expression.kind != ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeHelper.getCType(propAccess.expression);
    return propAccess.name.getText() == "slice" && objType == StringVarType;
  }
  public returnType(typeHelper: TypeHelper, call: ts.CallExpression) {
    return StringVarType;
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CStringSlice(scope, node);
  }
  public needsDisposal(typeHelper: TypeHelper, node: ts.CallExpression) {
    // if parent is expression statement, then this is the top expression
    // and thus return value is not used, so the temporary variable will not be created
    return node.parent.kind != ts.SyntaxKind.ExpressionStatement;
  }
  public getTempVarName(typeHelper: TypeHelper, node: ts.CallExpression) {
    return "substr";
  }
  public getEscapeNode(typeHelper: TypeHelper, node: ts.CallExpression) {
    return null;
  }
}

@CodeTemplate(`
{#statements}
    {#if !topExpressionOfStatement && start && end}
        {tempVarName} = str_slice({varAccess}, {start}, {end});
    {#elseif !topExpressionOfStatement && start && !end}
        {tempVarName} = str_slice({varAccess}, {start}, str_len({varAccess}));
    {/if}
{/statements}
{#if !topExpressionOfStatement && start}
    {tempVarName}
{#elseif !topExpressionOfStatement && !start}
    /* Error: String.slice requires at least one parameter! */
{/if}`)
class CStringSlice {
  public topExpressionOfStatement: boolean;
  public varAccess: CElementAccess = null;
  public start: CExpression = null;
  public end: CExpression = null;
  public tempVarName: string;
  constructor(scope: IScope, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    this.varAccess = new CElementAccess(scope, propAccess.expression);
    this.topExpressionOfStatement =
      call.parent.kind == ts.SyntaxKind.ExpressionStatement;

    if (!this.topExpressionOfStatement) {
      if (call.arguments.length == 0) {
        console.log(
          "Error in " + call.getText() + ". At least one parameter expected!"
        );
      } else {
        this.tempVarName = scope.root.memoryManager.getReservedTemporaryVarName(
          call
        );
        if (!scope.root.memoryManager.variableWasReused(call)) {
          scope.variables.push(
            new CVariable(scope, this.tempVarName, StringVarType)
          );
        }
        this.start = CodeTemplateFactory.createForNode(
          scope,
          call.arguments[0]
        );
        if (call.arguments.length >= 2) {
          this.end = CodeTemplateFactory.createForNode(
            scope,
            call.arguments[1]
          );
        }
      }
    }
    scope.root.headerFlags.str_slice = true;
  }
}
