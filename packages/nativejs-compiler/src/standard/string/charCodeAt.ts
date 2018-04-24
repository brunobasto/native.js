import * as ts from "typescript";
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
  StringVarType,
  TypeHelper
} from "../../core/types";

@StandardCallResolver
class StringCharCodeAtResolver implements IResolver {
  public matchesNode(typeHelper: TypeHelper, call: ts.CallExpression) {
    if (call.expression.kind != ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeHelper.inferNodeType(propAccess.expression);
    return (
      propAccess.name.getText() == "charCodeAt" && objType == StringVarType
    );
  }
  public returnType(typeHelper: TypeHelper, call: ts.CallExpression) {
    return NumberVarType;
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CStringSearch(scope, node);
  }
  public needsDisposal(typeHelper: TypeHelper, node: ts.CallExpression) {
    return false;
  }
  public getTempVarName(typeHelper: TypeHelper, node: ts.CallExpression) {
    return null;
  }
  public getEscapeNode(typeHelper: TypeHelper, node: ts.CallExpression) {
    return null;
  }
}

@CodeTemplate(`
{#if !topExpressionOfStatement}
    str_char_code_at({strAccess}, {position})
{/if}`)
class CStringSearch {
  public topExpressionOfStatement: boolean;
  public strAccess: CElementAccess;
  public position: CExpression;
  constructor(scope: IScope, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    this.topExpressionOfStatement =
      call.parent.kind == ts.SyntaxKind.ExpressionStatement;
    if (!this.topExpressionOfStatement) {
      if (call.arguments.length == 1) {
        this.strAccess = new CElementAccess(scope, propAccess.expression);
        this.position = CodeTemplateFactory.createForNode(
          scope,
          call.arguments[0]
        );
        scope.root.headerFlags.str_char_code_at = true;
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
