import * as ts from "typescript";
import { HeaderRegistry } from "../../core/header";
import {
  CElementAccess,
  CSimpleElementAccess
} from "../../nodes/elementaccess";
import { CExpression, CSimpleBinaryExpression } from "../../nodes/expressions";
import { CVariable } from "../../nodes/variable";
import { IScope } from "../../core/program";
import { IResolver, StandardCallResolver } from "../../core/resolver";
import { CodeTemplate, CodeTemplateFactory } from "../../core/template";
import {
  ArrayType,
  NumberVarType,
  StringVarType,
  TypeHelper
} from "../../core/types";

@StandardCallResolver
class ArrayLastIndexOfResolver implements IResolver {
  public matchesNode(typeHelper: TypeHelper, call: ts.CallExpression) {
    if (call.expression.kind != ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeHelper.inferNodeType(propAccess.expression);
    return (
      propAccess.name.getText() == "lastIndexOf" && objType instanceof ArrayType
    );
  }
  public returnType(typeHelper: TypeHelper, call: ts.CallExpression) {
    return NumberVarType;
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CArrayLastIndexOf(scope, node);
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
{#statements}
    {#if !topExpressionOfStatement && staticArraySize}
        {tempVarName} = -1;
        for ({iteratorVarName} = {staticArraySize} - 1; {iteratorVarName} >= 0; {iteratorVarName}--) {
            if ({comparison}) {
                {tempVarName} = {iteratorVarName};
                break;
            }
        }
    {#elseif !topExpressionOfStatement}
        {tempVarName} = -1;
        for ({iteratorVarName} = {varAccess}->size - 1; {iteratorVarName} >= 0; {iteratorVarName}--) {
            if ({comparison}) {
                {tempVarName} = {iteratorVarName};
                break;
            }
        }
    {/if}
{/statements}
{#if !topExpressionOfStatement}
    {tempVarName}
{/if}`)
class CArrayLastIndexOf {
  public topExpressionOfStatement: boolean;
  public tempVarName: string = "";
  public iteratorVarName: string;
  public comparison: CSimpleBinaryExpression;
  public staticArraySize: string = "";
  public varAccess: CElementAccess = null;
  constructor(scope: IScope, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = scope.root.typeHelper.inferNodeType(
      propAccess.expression
    ) as ArrayType;
    this.varAccess = new CElementAccess(scope, propAccess.expression);
    const args = call.arguments.map(a =>
      CodeTemplateFactory.createForNode(scope, a)
    );
    this.topExpressionOfStatement =
      call.parent.kind == ts.SyntaxKind.ExpressionStatement;

    if (!this.topExpressionOfStatement) {
      this.tempVarName = scope.root.typeHelper.addNewTemporaryVariable(
        propAccess,
        "arr_pos"
      );
      this.iteratorVarName = scope.root.typeHelper.addNewIteratorVariable(
        propAccess
      );
      this.staticArraySize = objType.isDynamicArray
        ? ""
        : objType.capacity + "";
      scope.variables.push(
        new CVariable(scope, this.tempVarName, NumberVarType)
      );
      scope.variables.push(
        new CVariable(scope, this.iteratorVarName, NumberVarType)
      );
      const arrayElementAccess = new CSimpleElementAccess(
        scope,
        objType,
        this.varAccess,
        this.iteratorVarName
      );
      this.comparison = new CSimpleBinaryExpression(
        scope,
        arrayElementAccess,
        objType.elementType,
        args[0],
        objType.elementType,
        ts.SyntaxKind.EqualsEqualsToken,
        call
      );
    }
  }
}
