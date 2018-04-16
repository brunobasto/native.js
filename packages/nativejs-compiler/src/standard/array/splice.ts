import * as ts from "typescript";
import {
  ArrayCreateHeaderType,
  ArrayInsertHeaderType,
  ArrayRemoveHeaderType,
  HeaderRegistry
} from "../../core/header";
import { CElementAccess } from "../../nodes/elementaccess";
import { CExpression } from "../../nodes/expressions";
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
class ArraySpliceResolver implements IResolver {
  public matchesNode(typeHelper: TypeHelper, call: ts.CallExpression) {
    if (call.expression.kind != ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeHelper.getCType(propAccess.expression);
    return (
      propAccess.name.getText() == "splice" &&
      objType instanceof ArrayType &&
      objType.isDynamicArray
    );
  }
  public returnType(typeHelper: TypeHelper, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    return typeHelper.getCType(propAccess.expression);
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CArraySplice(scope, node);
  }
  public needsDisposal(typeHelper: TypeHelper, node: ts.CallExpression) {
    // if parent is expression statement, then this is the top expression
    // and thus return value is not used, so the temporary variable will not be created
    return node.parent.kind != ts.SyntaxKind.ExpressionStatement;
  }
  public getTempVarName(typeHelper: TypeHelper, node: ts.CallExpression) {
    return "tmp_removed_values";
  }
  public getEscapeNode(typeHelper: TypeHelper, node: ts.CallExpression) {
    return (node.expression as ts.PropertyAccessExpression).expression;
  }
}

@CodeTemplate(`
{#statements}
    {#if !topExpressionOfStatement}
        ARRAY_CREATE({tempVarName}, {deleteCountArg}, {deleteCountArg});
        for ({iteratorVarName} = 0; {iteratorVarName} < {deleteCountArg}; {iteratorVarName}++)
            {tempVarName}->data[{iteratorVarName}] = {varAccess}->data[{iteratorVarName}+(({startPosArg}) < 0 ? {varAccess}->size + ({startPosArg}) : ({startPosArg}))];
        ARRAY_REMOVE({varAccess}, ({startPosArg}) < 0 ? {varAccess}->size + ({startPosArg}) : ({startPosArg}), {deleteCountArg});
        {insertValues}
    {/if}
{/statements}
{#if topExpressionOfStatement && needsRemove}
    ARRAY_REMOVE({varAccess}, ({startPosArg}) < 0 ? {varAccess}->size + ({startPosArg}) : ({startPosArg}), {deleteCountArg});
    {insertValues}
{#elseif topExpressionOfStatement && !needsRemove}
    {insertValues}
{#else}
    {tempVarName}
{/if}`)
class CArraySplice {
  public topExpressionOfStatement: boolean;
  public tempVarName: string = "";
  public iteratorVarName: string;
  public varAccess: CElementAccess = null;
  public startPosArg: CExpression;
  public deleteCountArg: CExpression;
  public insertValues: CInsertValue[] = [];
  public needsRemove: boolean = false;
  constructor(scope: IScope, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    this.varAccess = new CElementAccess(scope, propAccess.expression);
    const args = call.arguments.map(a =>
      CodeTemplateFactory.createForNode(scope, a)
    );
    this.startPosArg = args[0];
    this.deleteCountArg = args[1];
    this.topExpressionOfStatement =
      call.parent.kind == ts.SyntaxKind.ExpressionStatement;

    if (!this.topExpressionOfStatement) {
      HeaderRegistry.declareDependency(ArrayCreateHeaderType);
      this.tempVarName = scope.root.memoryManager.getReservedTemporaryVarName(
        call
      );
      const type = scope.root.typeHelper.getCType(propAccess.expression);
      if (!scope.root.memoryManager.variableWasReused(call)) {
        scope.variables.push(new CVariable(scope, this.tempVarName, type));
      }
      this.iteratorVarName = scope.root.typeHelper.addNewIteratorVariable(
        propAccess
      );
      scope.variables.push(
        new CVariable(scope, this.iteratorVarName, NumberVarType)
      );
    }
    if (call.arguments.length > 2) {
      this.insertValues = args
        .slice(2)
        .reverse()
        .map(a => new CInsertValue(scope, this.varAccess, this.startPosArg, a));
      HeaderRegistry.declareDependency(ArrayInsertHeaderType);
    }
    if (call.arguments[1].kind == ts.SyntaxKind.NumericLiteral) {
      this.needsRemove = call.arguments[1].getText() != "0";
    }
    HeaderRegistry.declareDependency(ArrayRemoveHeaderType);
  }
}

@CodeTemplate(`ARRAY_INSERT({varAccess}, {startIndex}, {value});\n`)
class CInsertValue {
  constructor(
    scope: IScope,
    public varAccess: CElementAccess,
    public startIndex: CExpression,
    public value: CExpression
  ) {}
}
