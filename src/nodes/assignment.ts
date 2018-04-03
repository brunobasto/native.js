import * as ts from "typescript";
import { CodeTemplate, CodeTemplateFactory } from "../template";
import { IScope } from "../program";
import { CType, ArrayType, StructType, DictType } from "../types";
import { CElementAccess, CSimpleElementAccess } from "./elementaccess";
import { CExpression } from "./expressions";
import { CVariableAllocation } from "./variable";

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
    if (left.kind == ts.SyntaxKind.ElementAccessExpression) {
      let elemAccess = <ts.ElementAccessExpression>left;
      varType = scope.root.typeHelper.getCType(elemAccess.expression);
      if (elemAccess.expression.kind == ts.SyntaxKind.Identifier)
        accessor = elemAccess.expression.getText();
      else accessor = new CElementAccess(scope, elemAccess.expression);

      if (
        varType instanceof StructType &&
        elemAccess.argumentExpression.kind == ts.SyntaxKind.StringLiteral
      ) {
        let ident = elemAccess.argumentExpression.getText().slice(1, -1);
        if (ident.search(/^[_A-Za-z][_A-Za-z0-9]*$/) > -1)
          argumentExpression = ident;
        else
          argumentExpression = CodeTemplateFactory.createForNode(
            scope,
            elemAccess.argumentExpression
          );
      } else
        argumentExpression = CodeTemplateFactory.createForNode(
          scope,
          elemAccess.argumentExpression
        );
    } else {
      varType = scope.root.typeHelper.getCType(left);
      accessor = new CElementAccess(scope, left);
      argumentExpression = null;
    }
    return new CAssignment(
      scope,
      accessor,
      argumentExpression,
      varType,
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
{#elseif isDynamicArray && argumentExpression == null}
    {accessor} = ((void *){expression}){CR}
{#elseif argumentExpression == null}
    {accessor} = {expression}{CR}
{#elseif isStruct}
    {accessor}->{argumentExpression} = {expression}{CR}
{#elseif isDict}
    DICT_SET({accessor}, {argumentExpression}, {expression}){CR}
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
  public expression: CExpression;
  public nodeText: string;
  public CR: string;
  constructor(
    scope: IScope,
    public accessor: CElementAccess | CSimpleElementAccess | string,
    public argumentExpression: CExpression,
    type: CType,
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
      if (type instanceof StructType && typeof argumentExpression === "string")
        argType = type.properties[argumentExpression];
      else if (type instanceof ArrayType) argType = type.elementType;
      argAccessor = new CSimpleElementAccess(
        scope,
        type,
        accessor,
        argumentExpression
      );
    }

    let isTempVar = !!scope.root.memoryManager.getReservedTemporaryVarName(
      right
    );
    if (right.kind == ts.SyntaxKind.ObjectLiteralExpression && !isTempVar) {
      this.isObjLiteralAssignment = true;
      let objLiteral = <ts.ObjectLiteralExpression>right;
      this.objInitializers = objLiteral.properties
        .filter(p => p.kind == ts.SyntaxKind.PropertyAssignment)
        .map(p => <ts.PropertyAssignment>p)
        .map(
          p =>
            new CAssignment(
              scope,
              argAccessor,
              this.isDict ? '"' + p.name.getText() + '"' : p.name.getText(),
              argType,
              p.initializer
            )
        );
    } else if (
      right.kind == ts.SyntaxKind.ArrayLiteralExpression &&
      !isTempVar
    ) {
      this.isArrayLiteralAssignment = true;
      let arrLiteral = <ts.ArrayLiteralExpression>right;
      this.arrayLiteralSize = arrLiteral.elements.length;
      this.arrInitializers = arrLiteral.elements.map(
        (e, i) => new CAssignment(scope, argAccessor, "" + i, argType, e)
      );
    } else this.expression = CodeTemplateFactory.createForNode(scope, right);

    if (this.argumentExpression == null) {
      let expr =
        typeof this.expression == "string"
          ? this.expression
          : this.expression &&
            this.expression["resolve"] &&
            this.expression["resolve"]();
      let acc =
        typeof this.accessor == "string"
          ? this.accessor
          : this.accessor &&
            this.accessor["resolve"] &&
            this.accessor["resolve"]();
      if (expr == "" || acc == expr) this.assignmentRemoved = true;
    }
  }
}
