import * as ts from "typescript";
import {
  ArrayCreateHeaderType,
  ArrayInsertHeaderType,
  ArrayRemoveHeaderType,
  HeaderRegistry
} from "../../core/header";
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
class ArraySpliceResolver implements IResolver {
  public matchesNode(typeVisitor: TypeVisitor, call: ts.CallExpression) {
    if (call.expression.kind !== ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeVisitor.inferNodeType(propAccess.expression);
    return (
      propAccess.name.getText() === "splice" &&
      objType instanceof ArrayType &&
      objType.isDynamicArray
    );
  }
  public returnType(typeVisitor: TypeVisitor, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    return typeVisitor.inferNodeType(propAccess.expression);
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CArraySplice(scope, node);
  }
  public needsDisposal(typeVisitor: TypeVisitor, node: ts.CallExpression) {
    // if parent is expression statement, then this is the top expression
    // and thus return value is not used, so the temporary variable will not be created
    return node.parent.kind !== ts.SyntaxKind.ExpressionStatement;
  }
  public getTempVarName(typeVisitor: TypeVisitor, node: ts.CallExpression) {
    return "tmp_removed_values";
  }
  public getEscapeNode(typeVisitor: TypeVisitor, node: ts.CallExpression) {
    return (node.expression as ts.PropertyAccessExpression).expression;
  }
}
/* tslint:disable:max-line-length */
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
/* tslint:enable:max-line-length */
class CArraySplice {
  public topExpressionOfStatement: boolean;
  public tempVarName: string = "";
  public iteratorVarName: string;
  public varAccess: CElementAccess = null;
  public startPosArg: INativeExpression;
  public deleteCountArg: INativeExpression;
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
      call.parent.kind === ts.SyntaxKind.ExpressionStatement;

    if (!this.topExpressionOfStatement) {
      HeaderRegistry.declareDependency(ArrayCreateHeaderType);
      this.tempVarName = scope.root.memoryManager.getReservedTemporaryVarName(
        call
      );
      const type = scope.root.typeVisitor.inferNodeType(propAccess.expression);
      if (!scope.root.memoryManager.variableWasReused(call)) {
        scope.variables.push(new CVariable(scope, this.tempVarName, type));
      }
      this.iteratorVarName = scope.root.temporaryVariables.addNewIteratorVariable(
        propAccess
      );
      scope.variables.push(
        new CVariable(scope, this.iteratorVarName, IntegerType)
      );
    }
    if (call.arguments.length > 2) {
      this.insertValues = args
        .slice(2)
        .reverse()
        .map(a => new CInsertValue(scope, this.varAccess, this.startPosArg, a));
      HeaderRegistry.declareDependency(ArrayInsertHeaderType);
    }
    if (call.arguments[1].kind === ts.SyntaxKind.NumericLiteral) {
      this.needsRemove = call.arguments[1].getText() !== "0";
    }
    HeaderRegistry.declareDependency(ArrayRemoveHeaderType);
  }
}

@CodeTemplate(`ARRAY_INSERT({varAccess}, {startIndex}, {value});\n`)
class CInsertValue {
  constructor(
    scope: IScope,
    public varAccess: CElementAccess,
    public startIndex: INativeExpression,
    public value: INativeExpression
  ) {}
}
