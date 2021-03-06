import * as ts from "typescript";
import { IScope } from "../core/program";
import { CodeTemplate, CodeTemplateFactory } from "../core/template";
import {
  ArrayType,
  DictType,
  NativeType,
  StringType,
  StructType
} from "../core/types/NativeTypes";
import { CElementAccess, CSimpleElementAccess } from "./elementaccess";
import { INativeExpression } from "./expressions";
import { CVariable } from "./variable";

export class AssignmentHelper {
  public static create(
    scope: IScope,
    left: ts.Node,
    right: ts.Expression,
    inline: boolean = false
  ) {
    let accessor;
    let varType;
    let argumentExpression;
    if (left.kind === ts.SyntaxKind.ElementAccessExpression) {
      const elemAccess = left as ts.ElementAccessExpression;
      varType = scope.root.typeVisitor.inferNodeType(elemAccess.expression);
      if (elemAccess.expression.kind === ts.SyntaxKind.Identifier) {
        accessor = elemAccess.expression.getText();
      } else {
        accessor = new CElementAccess(scope, elemAccess.expression);
      }

      if (
        varType instanceof StructType &&
        elemAccess.argumentExpression.kind === ts.SyntaxKind.StringLiteral
      ) {
        const ident = elemAccess.argumentExpression.getText().slice(1, -1);
        if (ident.search(/^[_A-Za-z][_A-Za-z0-9]*$/) > -1) {
          argumentExpression = ident;
        } else {
          argumentExpression = CodeTemplateFactory.createForNode(
            scope,
            elemAccess.argumentExpression
          );
        }
      } else {
        argumentExpression = CodeTemplateFactory.createForNode(
          scope,
          elemAccess.argumentExpression
        );
      }
    } else {
      varType = scope.root.typeVisitor.inferNodeType(left);
      accessor = new CElementAccess(scope, left);
      argumentExpression = null;
    }
    return new CAssignment(
      scope,
      accessor,
      argumentExpression,
      varType,
      left,
      right,
      inline
    );
  }
}

@CodeTemplate(`
{#if assignmentRemoved}
{#elseif isObjLiteralAssignment}
    {objInitializers}
{#elseif isArrayLiteralAssignment}
    {arrInitializers}
{#elseif isDynamicArray && argumentExpression === null}
    {accessor} = ((void *){expression}){CR}
{#elseif argumentExpression === null}
    {accessor} = {expression}{CR}
{#elseif isStruct}
    {accessor}->{argumentExpression} = {expression}{CR}
{#elseif isDict && isStringValue}
    DICT_SET_STR_STR({accessor}, {argumentExpression}, {expression}){CR}
{#elseif isDict}
    DICT_SET_STR_INT({accessor}, {argumentExpression}, {expression}){CR}
{#elseif isDynamicArray}
    {accessor}->data[{argumentExpression}] = {expression}{CR}
{#elseif isStaticArray}
    {accessor}[{argumentExpression}] = {expression}{CR}
{#else}
    /* Unsupported assignment {accessor}[{argumentExpression}] = {nodeText} */{CR}
{/if}`)
export class CAssignment {
  public isObjLiteralAssignment: boolean = false;
  public objInitializers: CAssignment[];
  public isArrayLiteralAssignment: boolean = false;
  public arrayLiteralSize: number;
  public arrInitializers: CAssignment[];
  public isSimpleVar: boolean;
  public isDynamicArray: boolean = false;
  public isStaticArray: boolean = false;
  public isStruct: boolean = false;
  public isDict: boolean = false;
  public assignmentRemoved: boolean = false;
  public expression: INativeExpression;
  public nodeText: string;
  public CR: string;
  public isStringValue: number = 0;
  constructor(
    scope: IScope,
    public accessor: CElementAccess | CSimpleElementAccess | string,
    public argumentExpression: INativeExpression,
    type: NativeType,
    left: ts.Node,
    right: ts.Expression,
    inline: boolean = false
  ) {
    this.CR = inline ? "" : ";\n";
    this.isSimpleVar = typeof type === "string";
    this.isDynamicArray = type instanceof ArrayType && type.isDynamicArray;
    this.isStaticArray = type instanceof ArrayType && !type.isDynamicArray;
    this.isDict = type instanceof DictType;
    this.isStruct = type instanceof StructType;
    this.nodeText = right.getText();

    let argType = type;
    let argAccessor = accessor;
    if (argumentExpression) {
      if (
        type instanceof StructType &&
        typeof argumentExpression === "string"
      ) {
        argType = type.properties[argumentExpression];
      } else if (type instanceof ArrayType) {
        argType = type.elementType;
      }
      argAccessor = new CSimpleElementAccess(
        scope,
        type,
        accessor,
        argumentExpression
      );
    }

    const isTempVar = !!scope.root.memoryManager.getReservedTemporaryVarName(
      right
    );
    if (right.kind === ts.SyntaxKind.ObjectLiteralExpression && !isTempVar) {
      this.isObjLiteralAssignment = true;
      const objLiteral = right as ts.ObjectLiteralExpression;
      this.objInitializers = objLiteral.properties
        .filter(p => p.kind === ts.SyntaxKind.PropertyAssignment)
        .map(p => p as ts.PropertyAssignment)
        .map(
          p =>
            new CAssignment(
              scope,
              argAccessor,
              this.isDict ? '"' + p.name.getText() + '"' : p.name.getText(),
              argType,
              left,
              p.initializer
            )
        );
    } else if (
      right.kind === ts.SyntaxKind.ArrayLiteralExpression &&
      !isTempVar
    ) {
      this.isArrayLiteralAssignment = true;
      const arrLiteral = right as ts.ArrayLiteralExpression;
      this.arrayLiteralSize = arrLiteral.elements.length;
      this.arrInitializers = arrLiteral.elements.map(
        (e, i) => new CAssignment(scope, argAccessor, "" + i, argType, left, e)
      );
    } else {
      this.expression = CodeTemplateFactory.createForNode(scope, right);
    }

    if (this.argumentExpression === null) {
      const expr =
        typeof this.expression === "string"
          ? this.expression
          : this.expression &&
            this.expression["resolve"] &&
            this.expression["resolve"]();
      const acc =
        typeof this.accessor === "string"
          ? this.accessor
          : this.accessor &&
            this.accessor["resolve"] &&
            this.accessor["resolve"]();
      if (expr === "" || acc === expr) {
        this.assignmentRemoved = true;
      }
    }

    if (this.isDict) {
      const elementAccess = left as ts.ElementAccessExpression;
      // only do this when we have an argument expression
      if (elementAccess.argumentExpression as ts.Expression) {
        const isStringValue =
          scope.root.typeVisitor.inferNodeType(right) === StringType;
        if (isStringValue) {
          this.isStringValue = 1;
        }
      }

      scope.root.gc.trackAssignmentToDict(scope, left, right);
    } else if (this.argumentExpression === null) {
      scope.root.gc.trackAssignmentToVariable(left, right);
    } else if (scope.root.gc.resolveToTemporaryVariable(right)) {
      scope.root.gc.trackAssignmentToTemporaryVariable(left, right);
    }
  }
}
