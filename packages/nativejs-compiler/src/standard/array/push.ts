import * as ts from "typescript";
import { ArrayPushHeaderType, HeaderRegistry } from "../../core/header";
import { IScope } from "../../core/program";
import { IResolver, StandardCallResolver } from "../../core/resolver";
import { CodeTemplate, CodeTemplateFactory } from "../../core/template";
import {
  ArrayType,
  IntegerType,
  NativeType,
  StringType
} from "../../core/types/NativeTypes";
import { TypeVisitor } from "../../core/types/TypeVisitor";
import { CElementAccess } from "../../nodes/elementaccess";
import { INativeExpression } from "../../nodes/expressions";
import { CVariable } from "../../nodes/variable";

@StandardCallResolver
class ArrayPushResolver implements IResolver {
  public matchesNode(typeVisitor: TypeVisitor, call: ts.CallExpression) {
    if (call.expression.kind !== ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeVisitor.inferNodeType(propAccess.expression);
    return (
      propAccess.name.getText() === "push" &&
      objType instanceof ArrayType &&
      objType.isDynamicArray
    );
  }
  public returnType(typeVisitor: TypeVisitor, call: ts.CallExpression) {
    return IntegerType;
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CArrayPush(scope, node);
  }
  public needsDisposal(typeVisitor: TypeVisitor, node: ts.CallExpression) {
    return false;
  }
  public getTempVarName(typeVisitor: TypeVisitor, node: ts.CallExpression) {
    return null;
  }
  public getEscapeNode(typeVisitor: TypeVisitor, node: ts.CallExpression) {
    return (node.expression as ts.PropertyAccessExpression).expression;
  }
}

@CodeTemplate(`
{#statements}
    {#if !topExpressionOfStatement}
        {pushValues}
        {tempVarName} = {varAccess}->size;
    {/if}
{/statements}
{#if topExpressionOfStatement}
    {pushValues}
{#else}
    {tempVarName}
{/if}`)
class CArrayPush {
  public topExpressionOfStatement: boolean;
  public tempVarName: string = "";
  public varAccess: CElementAccess = null;
  public pushValues: CPushValue[] = [];
  constructor(scope: IScope, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    this.varAccess = new CElementAccess(scope, propAccess.expression);
    const types = call.arguments.map(a =>
      scope.root.typeVisitor.inferNodeType(a)
    );
    const args = call.arguments.map(a =>
      CodeTemplateFactory.createForNode(scope, a)
    );
    this.pushValues = args.map(
      (a, i) => new CPushValue(scope, this.varAccess, a, types[i])
    );
    this.topExpressionOfStatement =
      call.parent.kind === ts.SyntaxKind.ExpressionStatement;
    if (!this.topExpressionOfStatement) {
      this.tempVarName = scope.root.temporaryVariables.addNewTemporaryVariable(
        propAccess,
        "arr_size"
      );
      scope.variables.push(new CVariable(scope, this.tempVarName, IntegerType));
    }
    HeaderRegistry.declareDependency(ArrayPushHeaderType);
  }
}

@CodeTemplate(`
{#if isString}
  do {
    char * {tempStringName} = malloc(1 + strlen({value}));
    strcpy({tempStringName}, {value});
    ARRAY_PUSH({varAccess}, {tempStringName});
  } while (0);\n
{#else}
  ARRAY_PUSH({varAccess}, {value});\n
{/if}

`)
class CPushValue {
  public isString: boolean = false;
  public tempStringName: string;
  constructor(
    scope: IScope,
    public varAccess: CElementAccess,
    public value: INativeExpression,
    public type: NativeType
  ) {
    if (type === StringType) {
      this.isString = true;
      this.tempStringName = scope.root.gc.getUniqueName();
    }
  }
}
