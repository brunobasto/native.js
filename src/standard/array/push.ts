import * as ts from "typescript";
import { ArrayPushHeaderType, HeaderRegistry } from "../../core/header";
import { CElementAccess } from "../../nodes/elementaccess";
import { CExpression } from "../../nodes/expressions";
import { CVariable } from "../../nodes/variable";
import { IScope } from "../../program";
import { IResolver, StandardCallResolver } from "../../resolver";
import { CodeTemplate, CodeTemplateFactory } from "../../template";
import {
  CType,
  ArrayType,
  NumberVarType,
  StringVarType,
  TypeHelper
} from "../../types";

@StandardCallResolver
class ArrayPushResolver implements IResolver {
  public matchesNode(typeHelper: TypeHelper, call: ts.CallExpression) {
    if (call.expression.kind != ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeHelper.getCType(propAccess.expression);
    return (
      propAccess.name.getText() == "push" &&
      objType instanceof ArrayType &&
      objType.isDynamicArray
    );
  }
  public returnType(typeHelper: TypeHelper, call: ts.CallExpression) {
    return NumberVarType;
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CArrayPush(scope, node);
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
    const types = call.arguments.map(a => scope.root.typeHelper.getCType(a));
    const args = call.arguments.map(a =>
      CodeTemplateFactory.createForNode(scope, a)
    );
    this.pushValues = args.map(
      (a, i) => new CPushValue(scope, this.varAccess, a, types[i])
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
  isString: boolean = false;
  tempStringName: string;
  constructor(
    scope: IScope,
    public varAccess: CElementAccess,
    public value: CExpression,
    public type: CType
  ) {
    if (type == StringVarType) {
      this.isString = true;
      this.tempStringName = scope.root.gc.getUniqueName();
    }
  }
}
