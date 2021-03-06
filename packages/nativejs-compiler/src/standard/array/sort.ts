import * as ts from "typescript";
import { IScope } from "../../core/program";
import { IResolver, StandardCallResolver } from "../../core/resolver";
import { CodeTemplate, CodeTemplateFactory } from "../../core/template";
import {
  ArrayType,
  IntegerType,
  StringType
} from "../../core/types/NativeTypes";
import { TypeVisitor } from "../../core/types/TypeVisitor";
import { CElementAccess } from "../../nodes/elementaccess";
import { INativeExpression } from "../../nodes/expressions";
import { CVariable } from "../../nodes/variable";

@StandardCallResolver
class ArraySortResolver implements IResolver {
  public matchesNode(typeVisitor: TypeVisitor, call: ts.CallExpression) {
    if (call.expression.kind !== ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeVisitor.inferNodeType(propAccess.expression);
    return (
      propAccess.name.getText() === "sort" &&
      objType instanceof ArrayType &&
      objType.isDynamicArray
    );
  }
  public returnType(typeVisitor: TypeVisitor, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    return typeVisitor.inferNodeType(propAccess.expression);
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CArraySort(scope, node);
  }
  public needsDisposal(typeVisitor: TypeVisitor, node: ts.CallExpression) {
    return false;
  }
  public getTempVarName(typeVisitor: TypeVisitor, node: ts.CallExpression) {
    return "";
  }
  public getEscapeNode(typeVisitor: TypeVisitor, node: ts.CallExpression) {
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
    const type = scope.root.typeVisitor.inferNodeType(
      propAccess.expression
    ) as ArrayType;
    this.varAccess = new CElementAccess(scope, propAccess.expression);
    this.topExpressionOfStatement =
      call.parent.kind === ts.SyntaxKind.ExpressionStatement;
    this.arrayOfInts = type.elementType === IntegerType;
    this.arrayOfStrings = type.elementType === StringType;

    if (this.arrayOfInts) {
      scope.root.headerFlags.array_int16_t_cmp = true;
    } else if (this.arrayOfStrings) {
      scope.root.headerFlags.array_str_cmp = true;
    }
  }
}
