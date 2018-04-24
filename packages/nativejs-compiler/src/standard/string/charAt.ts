import * as ts from "typescript";
import { CElementAccess } from "../../nodes/elementaccess";
import { CExpression } from "../../nodes/expressions";
import { CVariable } from "../../nodes/variable";
import { IScope } from "../../core/program";
import { IResolver, StandardCallResolver } from "../../core/resolver";
import { CodeTemplate, CodeTemplateFactory } from "../../core/template";
import { HeaderRegistry, SubStringHeaderType } from "../../core/header";
import {
  ArrayType,
  IntegerType,
  StringType
} from "../../core/types/NativeTypes";
import { TypeHelper } from "../../core/types/TypeHelper";

@StandardCallResolver
class StringCharAtResolver implements IResolver {
  public matchesNode(typeHelper: TypeHelper, call: ts.CallExpression) {
    if (call.expression.kind != ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeHelper.inferNodeType(propAccess.expression);
    return propAccess.name.getText() == "charAt" && objType == StringType;
  }
  public returnType(typeHelper: TypeHelper, call: ts.CallExpression) {
    return StringType;
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CStringCharAt(scope, node);
  }
  public needsDisposal(typeHelper: TypeHelper, node: ts.CallExpression) {
    // if parent is expression statement, then this is the top expression
    // and thus return value is not used, so the temporary variable will not be created
    return node.parent.kind != ts.SyntaxKind.ExpressionStatement;
  }
  public getTempVarName(typeHelper: TypeHelper, node: ts.CallExpression) {
    return "char_at";
  }
  public getEscapeNode(typeHelper: TypeHelper, node: ts.CallExpression) {
    return null;
  }
}

@CodeTemplate(`
{#statements}
    {#if !topExpressionOfStatement && start != null}
        {tempVarName} = str_substring({varAccess}, {start}, ({start}) + 1);
    {/if}
{/statements}
{#if !topExpressionOfStatement && start != null}
    {tempVarName}
{#elseif !topExpressionOfStatement && start == null}
    /* Error: parameter expected for charAt */
{/if}`)
class CStringCharAt {
  public topExpressionOfStatement: boolean;
  public varAccess: CElementAccess = null;
  public start: CExpression = null;
  public tempVarName: string;
  constructor(scope: IScope, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    this.varAccess = new CElementAccess(scope, propAccess.expression);
    this.topExpressionOfStatement =
      call.parent.kind == ts.SyntaxKind.ExpressionStatement;

    if (!this.topExpressionOfStatement) {
      if (call.arguments.length == 0) {
        console.log("Error in " + call.getText() + ". Parameter expected!");
      } else {
        this.tempVarName = scope.root.memoryManager.getReservedTemporaryVarName(
          call
        );
        if (!scope.root.memoryManager.variableWasReused(call)) {
          scope.variables.push(
            new CVariable(scope, this.tempVarName, StringType)
          );
        }
        this.start = CodeTemplateFactory.createForNode(
          scope,
          call.arguments[0]
        );
      }
    }
    HeaderRegistry.declareDependency(SubStringHeaderType);
  }
}
