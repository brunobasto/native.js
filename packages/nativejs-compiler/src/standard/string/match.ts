import * as ts from "typescript";
import {
  HeaderRegistry,
  RegexMatchHeaderType,
  SubStringHeaderType
} from "../../core/header";
import { IScope } from "../../core/program";
import { IResolver, StandardCallResolver } from "../../core/resolver";
import { CodeTemplate, CodeTemplateFactory } from "../../core/template";
import { ArrayType, StringType } from "../../core/types/NativeTypes";
import { TypeVisitor } from "../../core/types/TypeVisitor";
import { CElementAccess } from "../../nodes/elementaccess";
import { INativeExpression } from "../../nodes/expressions";
import { CVariable } from "../../nodes/variable";

@StandardCallResolver
export class StringMatchResolver implements IResolver {
  public matchesNode(typeVisitor: TypeVisitor, call: ts.CallExpression) {
    if (call.expression.kind !== ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeVisitor.inferNodeType(propAccess.expression);
    return propAccess.name.getText() === "match" && objType === StringType;
  }
  public returnType(typeVisitor: TypeVisitor, call: ts.CallExpression) {
    return new ArrayType(StringType, 1, true);
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CStringMatch(scope, node);
  }
  public needsDisposal(typeVisitor: TypeVisitor, node: ts.CallExpression) {
    return node.parent.kind !== ts.SyntaxKind.ExpressionStatement;
  }
  public getTempVarName(typeVisitor: TypeVisitor, node: ts.CallExpression) {
    return "match_array";
  }
  public getEscapeNode(typeVisitor: TypeVisitor, node: ts.CallExpression) {
    return null;
  }
}

@CodeTemplate(`
{#statements}
    {#if !topExpressionOfStatement}
        {matchArrayVarName} = regex_match({regexVar}, {argAccess});
    {/if}
{/statements}
{#if !topExpressionOfStatement}
    {matchArrayVarName}
{/if}`)
class CStringMatch {
  public topExpressionOfStatement: boolean = false;
  public regexVar: INativeExpression;
  public argAccess: CElementAccess;
  public matchArrayVarName: string;
  public gcVarName: string = null;
  constructor(scope: IScope, call: ts.CallExpression) {
    HeaderRegistry.declareDependency(SubStringHeaderType);
    const propAccess = call.expression as ts.PropertyAccessExpression;
    this.topExpressionOfStatement =
      call.parent.kind === ts.SyntaxKind.ExpressionStatement;

    if (!this.topExpressionOfStatement) {
      if (call.arguments.length === 1) {
        this.argAccess = new CElementAccess(scope, propAccess.expression);
        this.regexVar = CodeTemplateFactory.createForNode(
          scope,
          call.arguments[0]
        );
        this.matchArrayVarName = scope.root.memoryManager.getReservedTemporaryVarName(
          call
        );
        if (!scope.root.memoryManager.variableWasReused(call)) {
          scope.variables.push(
            new CVariable(
              scope,
              this.matchArrayVarName,
              new ArrayType(StringType, 0, true)
            )
          );
        }
        HeaderRegistry.declareDependency(RegexMatchHeaderType);
        scope.root.headerFlags.gc_iterator = true;
      } else {
        console.log(
          "Unsupported number of parameters in " +
            call.getText() +
            ". Expected one parameter."
        );
      }
    }
  }
}
