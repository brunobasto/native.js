import * as ts from "typescript";
import { CElementAccess } from "../../nodes/elementaccess";
import { CExpression } from "../../nodes/expressions";
import { CVariable } from "../../nodes/variable";
import { IScope } from "../../core/program";
import { IResolver, StandardCallResolver } from "../../core/resolver";
import { CodeTemplate, CodeTemplateFactory } from "../../core/template";
import { ArrayType, NumberVarType, TypeHelper } from "../../core/types";

@StandardCallResolver
class ArraySortResolver implements IResolver {
  public matchesNode(typeHelper: TypeHelper, call: ts.CallExpression) {
    if (call.expression.kind != ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeHelper.inferNodeType(propAccess.expression);
    return (
      propAccess.name.getText() == "reverse" &&
      objType instanceof ArrayType &&
      objType.isDynamicArray
    );
  }
  public returnType(typeHelper: TypeHelper, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    return typeHelper.inferNodeType(propAccess.expression);
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CArrayReverse(scope, node);
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
    {iteratorVar1} = 0;
    {iteratorVar2} = {varAccess}->size - 1;
    while ({iteratorVar1} < {iteratorVar2}) {
        {tempVarName} = {varAccess}->data[{iteratorVar1}];
        {varAccess}->data[{iteratorVar1}] = {varAccess}->data[{iteratorVar2}];
        {varAccess}->data[{iteratorVar2}] = {tempVarName};
        {iteratorVar1}++;
        {iteratorVar2}--;
    }
{/statements}
{#if !topExpressionOfStatement}
    {varAccess}
{/if}`)
class CArrayReverse {
  public topExpressionOfStatement: boolean;
  public varAccess: CElementAccess = null;
  public iteratorVar1: string;
  public iteratorVar2: string;
  public tempVarName: string;
  constructor(scope: IScope, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const type = scope.root.typeHelper.inferNodeType(
      propAccess.expression
    ) as ArrayType;
    this.varAccess = new CElementAccess(scope, propAccess.expression);
    this.topExpressionOfStatement =
      call.parent.kind == ts.SyntaxKind.ExpressionStatement;
    this.iteratorVar1 = scope.root.typeHelper.addNewIteratorVariable(call);
    this.iteratorVar2 = scope.root.typeHelper.addNewIteratorVariable(call);
    this.tempVarName = scope.root.typeHelper.addNewTemporaryVariable(
      call,
      "temp"
    );
    scope.variables.push(
      new CVariable(scope, this.iteratorVar1, NumberVarType)
    );
    scope.variables.push(
      new CVariable(scope, this.iteratorVar2, NumberVarType)
    );
    scope.variables.push(
      new CVariable(scope, this.tempVarName, type.elementType)
    );
  }
}
