import * as ts from "typescript";
import {
  HeaderRegistry,
  StdlibHeaderType,
  StringHeaderType
} from "../../core/header";
import { CElementAccess } from "../../nodes/elementaccess";
import { CExpression } from "../../nodes/expressions";
import { CString } from "../../nodes/literals";
import { CVariable } from "../../nodes/variable";
import { IScope } from "../../core/program";
import { IResolver, StandardCallResolver } from "../../core/resolver";
import { CodeTemplate, CodeTemplateFactory } from "../../core/template";
import {
  ArrayType,
  CType,
  NumberVarType,
  StringVarType,
  TypeHelper
} from "../../core/types";

@StandardCallResolver
class ArrayConcatResolver implements IResolver {
  public matchesNode(typeHelper: TypeHelper, call: ts.CallExpression) {
    if (call.expression.kind != ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeHelper.getCType(propAccess.expression);
    return (
      (propAccess.name.getText() == "join" ||
        propAccess.name.getText() == "toString") &&
      objType instanceof ArrayType
    );
  }
  public returnType(typeHelper: TypeHelper, call: ts.CallExpression) {
    return StringVarType;
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CArrayJoin(scope, node);
  }
  public needsDisposal(typeHelper: TypeHelper, node: ts.CallExpression) {
    // if parent is expression statement, then this is the top expression
    // and thus return value is not used, so the temporary variable will not be created
    return node.parent.kind != ts.SyntaxKind.ExpressionStatement;
  }
  public getTempVarName(typeHelper: TypeHelper, node: ts.CallExpression) {
    return "tmp_joined_string";
  }
  public getEscapeNode(typeHelper: TypeHelper, node: ts.CallExpression) {
    return null;
  }
}

@CodeTemplate(`
{#statements}
    {#if !topExpressionOfStatement}
        {tempVarName} = malloc({calculatedStringLength});
        assert({tempVarName} != NULL);
        ((char *){tempVarName})[0] = '\\0';
        for ({iteratorVarName} = 0; {iteratorVarName} < {arraySize}; {iteratorVarName}++) {
            if ({iteratorVarName} > 0)
                strcat((char *){tempVarName}, {separator});
            {catFuncName}((char *){tempVarName}, {arrayElement}[{iteratorVarName}]);
        }
    {/if}
{/statements}
{#if !topExpressionOfStatement}
    {tempVarName}
{/if}`)
class CArrayJoin {
  public topExpressionOfStatement: boolean;
  public tempVarName: string = "";
  public iteratorVarName: string;
  public separator: CExpression;
  public varAccess: CElementAccess = null;
  public arraySize: CArraySize;
  public arrayElement: CArrayElement;
  public calculatedStringLength: CCalculateStringSize;
  public catFuncName: string;
  constructor(scope: IScope, call: ts.CallExpression) {
    this.topExpressionOfStatement =
      call.parent.kind == ts.SyntaxKind.ExpressionStatement;

    if (!this.topExpressionOfStatement) {
      const propAccess = call.expression as ts.PropertyAccessExpression;
      const type = scope.root.typeHelper.getCType(
        propAccess.expression
      ) as ArrayType;
      this.varAccess = new CElementAccess(scope, propAccess.expression);
      this.arraySize = new CArraySize(scope, this.varAccess, type);
      this.arrayElement = new CArrayElement(scope, this.varAccess, type);
      this.catFuncName =
        type.elementType == NumberVarType ? "str_int16_t_cat" : "strcat";
      this.tempVarName = scope.root.memoryManager.getReservedTemporaryVarName(
        call
      );
      if (!scope.root.memoryManager.variableWasReused(call)) {
        scope.variables.push(new CVariable(scope, this.tempVarName, "char *"));
      }
      this.iteratorVarName = scope.root.typeHelper.addNewIteratorVariable(call);
      scope.variables.push(
        new CVariable(scope, this.iteratorVarName, NumberVarType)
      );
      this.calculatedStringLength = new CCalculateStringSize(
        scope,
        this.varAccess,
        this.iteratorVarName,
        type,
        call
      );
      if (call.arguments.length > 0 && propAccess.name.getText() == "join") {
        this.separator = CodeTemplateFactory.createForNode(
          scope,
          call.arguments[0]
        );
      } else {
        this.separator = new CString(scope, ",");
      }
      HeaderRegistry.declareDependency(StdlibHeaderType);
      HeaderRegistry.declareDependency(StringHeaderType);

      if (type.elementType == NumberVarType) {
        scope.root.headerFlags.str_int16_t_cat = true;
      }
    }
  }
}

@CodeTemplate(`
{#if type.isDynamicArray}
    {varAccess}->size
{#else}
    {arrayCapacity}
{/if}`)
class CArraySize {
  public arrayCapacity: string;
  constructor(
    scope: IScope,
    public varAccess: CElementAccess,
    public type: ArrayType
  ) {
    this.arrayCapacity = type.capacity + "";
  }
}

@CodeTemplate(`
{#if type.isDynamicArray}
    {varAccess}->data
{#else}
    {varAccess}
{/if}`)
class CArrayElement {
  constructor(
    scope: IScope,
    public varAccess: CElementAccess,
    public type: ArrayType
  ) {}
}

@CodeTemplate(`
{#statements}
    {#if arrayOfStrings}
        {lengthVarName} = 0;
        for ({iteratorVarName} = 0; {iteratorVarName} < {arraySize}; {iteratorVarName}++)
            {lengthVarName} += strlen({arrayElement}[{iteratorVarName}]);
    {/if}
{/statements}
{#if type.isDynamicArray && arrayOfStrings}
    {arraySize} == 0 ? 1 : {lengthVarName} + strlen({separator})*({arraySize}-1) + 1
{#elseif arrayCapacity > 0 && arrayOfStrings}
    {lengthVarName} + strlen({separator})*({arraySize}-1) + 1
{#elseif type.isDynamicArray && arrayOfNumbers}
    {varAccess}->size == 0 ? 1 : STR_INT16_T_BUFLEN*{varAccess}->size + strlen({separator})*({arraySize}-1) + 1
{#elseif arrayCapacity > 0 && arrayOfNumbers}
    STR_INT16_T_BUFLEN*{arraySize}+strlen({separator})*({arraySize}-1)+1
{#else}
    1
{/if}`)
class CCalculateStringSize {
  public lengthVarName: string;
  public arrayOfStrings: boolean;
  public arrayOfNumbers: boolean;
  public arrayCapacity: string;
  public arraySize: CArraySize;
  public arrayElement: CArrayElement;
  constructor(
    scope: IScope,
    public varAccess: CElementAccess,
    public iteratorVarName: string,
    public type: ArrayType,
    node: ts.Node
  ) {
    this.arrayOfStrings = type.elementType == StringVarType;
    this.arrayOfNumbers = type.elementType == NumberVarType;
    this.arrayCapacity = type.capacity + "";
    this.arraySize = new CArraySize(scope, this.varAccess, type);
    this.arrayElement = new CArrayElement(scope, this.varAccess, type);
    if (this.arrayOfStrings) {
      this.lengthVarName = scope.root.typeHelper.addNewTemporaryVariable(
        node,
        "len"
      );
      scope.variables.push(
        new CVariable(scope, this.lengthVarName, NumberVarType)
      );
    }
  }
}
