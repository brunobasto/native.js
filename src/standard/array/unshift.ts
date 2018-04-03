import * as ts from "typescript";
import { ArrayInsertHeaderType, HeaderRegistry } from "../../core/header";
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
class ArrayUnshiftResolver implements IResolver {
  public matchesNode(typeHelper: TypeHelper, call: ts.CallExpression) {
    if (call.expression.kind != ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeHelper.getCType(propAccess.expression);
    return (
      propAccess.name.getText() == "unshift" &&
      objType instanceof ArrayType &&
      objType.isDynamicArray
    );
  }
  public returnType(typeHelper: TypeHelper, call: ts.CallExpression) {
    return NumberVarType;
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CArrayUnshift(scope, node);
  }
  public needsDisposal(typeHelper: TypeHelper, node: ts.CallExpression) {
    return false;
  }
  public getTempVarName(typeHelper: TypeHelper, node: ts.CallExpression) {
    return null;
  }
  public getEscapeNode(typeHelper: TypeHelper, node: ts.CallExpression) {
    return (node.expression as ts.PropertyAccessExpression).expression;
  }
}

@CodeTemplate(`
{#statements}
    {#if !topExpressionOfStatement}
        {unshiftValues}
        {tempVarName} = {varAccess}->size;
    {/if}
{/statements}
{#if topExpressionOfStatement}
    {unshiftValues}
{#else}
    {tempVarName}
{/if}`)
class CArrayUnshift {
  public topExpressionOfStatement: boolean;
  public tempVarName: string = "";
  public varAccess: CElementAccess = null;
  public unshiftValues: CUnshiftValue[] = [];
  constructor(scope: IScope, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    this.varAccess = new CElementAccess(scope, propAccess.expression);
    const args = call.arguments.map(a =>
      CodeTemplateFactory.createForNode(scope, a)
    );
    this.unshiftValues = args.map(
      a => new CUnshiftValue(scope, this.varAccess, a)
    );
    this.topExpressionOfStatement =
      call.parent.kind == ts.SyntaxKind.ExpressionStatement;
    if (!this.topExpressionOfStatement) {
      this.tempVarName = scope.root.typeHelper.addNewTemporaryVariable(
        propAccess,
        "arr_size"
      );
      scope.variables.push(
        new CVariable(scope, this.tempVarName, NumberVarType)
      );
    }
    HeaderRegistry.declareDependency(ArrayInsertHeaderType);
  }
}

@CodeTemplate(`ARRAY_INSERT({varAccess}, 0, {value});\n`)
class CUnshiftValue {
  constructor(
    scope: IScope,
    public varAccess: CElementAccess,
    public value: CExpression
  ) {}
}
