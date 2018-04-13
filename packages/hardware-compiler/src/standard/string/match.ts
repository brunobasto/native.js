import * as ts from "typescript";
import {
  ArrayPushHeaderType,
  HeaderRegistry,
  SubStringHeaderType,
  RegexMatchHeaderType
} from "../../core/header";
import { CElementAccess } from "../../nodes/elementaccess";
import { CExpression } from "../../nodes/expressions";
import { CVariable } from "../../nodes/variable";
import { IScope } from "../../core/program";
import { RegexBuilder, RegexMachine, RegexState } from "../../util/regex";
import { IResolver, StandardCallResolver } from "../../core/resolver";
import { CodeTemplate, CodeTemplateFactory } from "../../core/template";
import {
  ArrayType,
  NumberVarType,
  RegexMatchVarType,
  RegexVarType,
  StringVarType,
  TypeHelper
} from "../../core/types";

@StandardCallResolver
export class StringMatchResolver implements IResolver {
  public matchesNode(typeHelper: TypeHelper, call: ts.CallExpression) {
    if (call.expression.kind != ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeHelper.getCType(propAccess.expression);
    return propAccess.name.getText() == "match" && objType == StringVarType;
  }
  public returnType(typeHelper: TypeHelper, call: ts.CallExpression) {
    return new ArrayType(StringVarType, 1, true);
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CStringMatch(scope, node);
  }
  public needsDisposal(typeHelper: TypeHelper, node: ts.CallExpression) {
    return node.parent.kind != ts.SyntaxKind.ExpressionStatement;
  }
  public getTempVarName(typeHelper: TypeHelper, node: ts.CallExpression) {
    return "match_array";
  }
  public getEscapeNode(typeHelper: TypeHelper, node: ts.CallExpression) {
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
  public regexVar: CExpression;
  public argAccess: CElementAccess;
  public matchArrayVarName: string;
  public gcVarName: string = null;
  constructor(scope: IScope, call: ts.CallExpression) {
    HeaderRegistry.declareDependency(SubStringHeaderType);
    const propAccess = call.expression as ts.PropertyAccessExpression;
    this.topExpressionOfStatement =
      call.parent.kind == ts.SyntaxKind.ExpressionStatement;

    if (!this.topExpressionOfStatement) {
      if (call.arguments.length == 1) {
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
              new ArrayType(StringVarType, 0, true)
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
