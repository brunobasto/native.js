import * as ts from "typescript";
import { CElementAccess } from "../../nodes/elementaccess";
import { CExpression } from "../../nodes/expressions";
import { CVariable } from "../../nodes/variable";
import { IScope } from "../../program";
import { RegexBuilder, RegexMachine, RegexState } from "../../regex";
import { IResolver, StandardCallResolver } from "../../resolver";
import { CodeTemplate, CodeTemplateFactory } from "../../template";
import {
  ArrayType,
  NumberVarType,
  StringVarType,
  TypeHelper
} from "../../types";

@StandardCallResolver
class StringIndexOfResolver implements IResolver {
  public matchesNode(typeHelper: TypeHelper, call: ts.CallExpression) {
    if (call.expression.kind != ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeHelper.getCType(propAccess.expression);
    return propAccess.name.getText() == "indexOf" && objType == StringVarType;
  }
  public returnType(typeHelper: TypeHelper, call: ts.CallExpression) {
    return NumberVarType;
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CStringIndexOf(scope, node);
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
    str_pos({stringAccess}, {arg1})
{/if}`)
class CStringIndexOf {
  public topExpressionOfStatement: boolean;
  public arg1: CExpression;
  public stringAccess: CElementAccess;
  constructor(scope: IScope, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    this.topExpressionOfStatement =
      call.parent.kind == ts.SyntaxKind.ExpressionStatement;
    if (!this.topExpressionOfStatement) {
      if (call.arguments.length == 1) {
        this.stringAccess = new CElementAccess(scope, propAccess.expression);
        this.arg1 = CodeTemplateFactory.createForNode(scope, call.arguments[0]);
        scope.root.headerFlags.str_pos = true;
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
