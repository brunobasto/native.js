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
class ArraySortResolver implements IResolver {
  public matchesNode(typeHelper: TypeHelper, call: ts.CallExpression) {
    if (call.expression.kind != ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeHelper.getCType(propAccess.expression);
    return (
      propAccess.name.getText() == "sort" &&
      objType instanceof ArrayType &&
      objType.isDynamicArray
    );
  }
  public returnType(typeHelper: TypeHelper, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    return typeHelper.getCType(propAccess.expression);
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CArraySort(scope, node);
  }
  public needsDisposal(typeHelper: TypeHelper, node: ts.CallExpression) {
    return false;
  }
  public getTempVarName(typeHelper: TypeHelper, node: ts.CallExpression) {
    return "";
  }
  public getEscapeNode(typeHelper: TypeHelper, node: ts.CallExpression) {
    return null;
  }
}

@CodeTemplate(`
{#statements}
    {#if !topExpressionOfStatement && arrayOfInts}
        qsort({varAccess}->data, {varAccess}->size, sizeof(*{varAccess}->data), array_int16_t_cmp);
    {#elseif !topExpressionOfStatement && arrayOfStrings}
        qsort({varAccess}->data, {varAccess}->size, sizeof(*{varAccess}->data), array_str_cmp);
    {/if}
{/statements}
{#if !topExpressionOfStatement}
    {varAccess}
{#elseif arrayOfInts}
    qsort({varAccess}->data, {varAccess}->size, sizeof(*{varAccess}->data), array_int16_t_cmp);
{#elseif arrayOfStrings}
    qsort({varAccess}->data, {varAccess}->size, sizeof(*{varAccess}->data), array_str_cmp);
{/if}`)
class CArraySort {
  public topExpressionOfStatement: boolean;
  public varAccess: CElementAccess = null;
  public arrayOfInts: boolean = false;
  public arrayOfStrings: boolean = false;
  constructor(scope: IScope, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const type = scope.root.typeHelper.getCType(
      propAccess.expression
    ) as ArrayType;
    this.varAccess = new CElementAccess(scope, propAccess.expression);
    this.topExpressionOfStatement =
      call.parent.kind == ts.SyntaxKind.ExpressionStatement;
    this.arrayOfInts = type.elementType == NumberVarType;
    this.arrayOfStrings = type.elementType == StringVarType;

    if (this.arrayOfInts) {
      scope.root.headerFlags.array_int16_t_cmp = true;
    } else if (this.arrayOfStrings) {
      scope.root.headerFlags.array_str_cmp = true;
    }
  }
}
