import * as ts from "typescript";
import { IScope } from "../../core/program";
import { IResolver, StandardCallResolver } from "../../core/resolver";
import { CodeTemplate, CodeTemplateFactory } from "../../core/template";
import {
  ArrayType,
  IntegerType,
  StringType
} from "../../core/types/NativeTypes";
import { TypeRegistry } from "../../core/types/TypeRegistry";
import { TypeVisitor } from "../../core/types/TypeVisitor";
import { CElementAccess } from "../../nodes/elementaccess";
import { INativeExpression } from "../../nodes/expressions";
import { CVariable } from "../../nodes/variable";

@StandardCallResolver
class ArrayForEachResolver implements IResolver {
  public matchesNode(typeVisitor: TypeVisitor, call: ts.CallExpression) {
    if (call.expression.kind !== ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeVisitor.inferNodeType(propAccess.expression);
    return (
      propAccess.name.getText() === "forEach" && objType instanceof ArrayType
    );
  }
  public returnType(typeVisitor: TypeVisitor, call: ts.CallExpression) {
    return "void";
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CArrayForEach(scope, node);
  }
  public needsDisposal(typeVisitor: TypeVisitor, node: ts.CallExpression) {
    return false;
  }
  public getTempVarName(typeVisitor: TypeVisitor, node: ts.CallExpression) {
    return null;
  }
  public getEscapeNode(typeVisitor: TypeVisitor, node: ts.CallExpression) {
    return node;
  }
}

@CodeTemplate(`
{#statements}
    {#if staticArraySize}
        for ({iteratorVarName} = 0; {iteratorVarName} < {staticArraySize}; {iteratorVarName}++) {
            {iteratorFnAccess}({varAccess}[{iteratorVarName}]);
        }
    {#else}
        for ({iteratorVarName} = 0; {iteratorVarName} < {varAccess}->size; {iteratorVarName}++) {
            iteratorFnAccess({varAccess}[{iteratorVarName}]);
        }
    {/if}
{/statements}`)
class CArrayForEach {
  public iteratorFnAccess: CElementAccess = null;
  public iteratorVarName: string;
  public staticArraySize: string = "";
  public topExpressionOfStatement: boolean;
  public varAccess: CElementAccess = null;

  constructor(scope: IScope, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;

    this.varAccess = new CElementAccess(scope, propAccess.expression);
    this.topExpressionOfStatement =
      call.parent.kind === ts.SyntaxKind.ExpressionStatement;

    const objType = scope.root.typeVisitor.inferNodeType(
      propAccess.expression
    ) as ArrayType;

    this.iteratorVarName = scope.root.temporaryVariables.addNewIteratorVariable(
      propAccess
    );
    this.staticArraySize = objType.isDynamicArray ? "" : objType.capacity + "";

    if (call.arguments.length === 0) {
      throw Error("Array.forEach needs an argument.");
    }

    TypeRegistry.declareNodeType(call.arguments[0], "void");

    const args = call.arguments.map(a =>
      CodeTemplateFactory.createForNode(scope, a)
    );

    this.iteratorFnAccess = args[0];

    scope.variables.push(
      new CVariable(scope, this.iteratorVarName, IntegerType)
    );
  }
}

@CodeTemplate(`
{#if staticArraySize}
    {staticArraySize}
{#elseif isArray}
    {value}->size
{#else}
    1
{/if}`)
class CGetSize {
  public staticArraySize: number;
  public isArray: boolean;
  constructor(
    scope: IScope,
    valueNode: ts.Node,
    public value: INativeExpression
  ) {
    const type = scope.root.typeVisitor.inferNodeType(valueNode);
    this.isArray = type instanceof ArrayType;
    this.staticArraySize = type instanceof ArrayType && type.capacity;
  }
}
