import * as ts from "typescript";
import { CodeTemplate, CodeTemplateFactory } from "../core/template";
import { IScope } from "../core/program";
import {
  NativeType,
  ArrayType,
  StructType,
  DictType,
  StringType,
  UniversalType,
  PointerType
} from "../core/types/NativeTypes";
import { HeaderRegistry, StringLengthHeaderType } from "../core/header";
import { CExpression } from "./expressions";

@CodeTemplate(`{simpleAccessor}`, [
  ts.SyntaxKind.ElementAccessExpression,
  ts.SyntaxKind.PropertyAccessExpression,
  ts.SyntaxKind.Identifier
])
export class CElementAccess {
  public simpleAccessor: CSimpleElementAccess;
  constructor(scope: IScope, node: ts.Node) {
    let type: NativeType = null;
    let elementAccess: CElementAccess | string = null;
    let argumentExpression: string = null;

    if (node.kind == ts.SyntaxKind.Identifier) {
      type = scope.root.typeVisitor.inferNodeType(node);
      elementAccess = node.getText();
      let isLogicalContext =
        (node.parent.kind == ts.SyntaxKind.IfStatement ||
          node.parent.kind == ts.SyntaxKind.WhileStatement ||
          node.parent.kind == ts.SyntaxKind.DoStatement) &&
        node.parent["expression"] == node;
      if (
        !isLogicalContext &&
        node.parent.kind == ts.SyntaxKind.ForStatement &&
        node.parent["condition"] == node
      )
        isLogicalContext = true;
      if (
        !isLogicalContext &&
        node.parent.kind == ts.SyntaxKind.BinaryExpression
      ) {
        let binExpr = <ts.BinaryExpression>node.parent;
        if (
          binExpr.operatorToken.kind == ts.SyntaxKind.AmpersandAmpersandToken ||
          binExpr.operatorToken.kind == ts.SyntaxKind.BarBarToken
        )
          isLogicalContext = true;
      }
      if (
        !isLogicalContext &&
        node.parent.kind == ts.SyntaxKind.PrefixUnaryExpression
      ) {
        let binExpr = <ts.PrefixUnaryExpression>node.parent;
        if (binExpr.operator == ts.SyntaxKind.ExclamationToken)
          isLogicalContext = true;
      }

      if (
        isLogicalContext &&
        type instanceof ArrayType &&
        !type.isDynamicArray
      ) {
        argumentExpression = "0";
      }
    } else if (node.kind == ts.SyntaxKind.PropertyAccessExpression) {
      let propAccess = <ts.PropertyAccessExpression>node;
      type = scope.root.typeVisitor.inferNodeType(propAccess.expression);
      if (propAccess.expression.kind == ts.SyntaxKind.Identifier)
        elementAccess = propAccess.expression.getText();
      else elementAccess = new CElementAccess(scope, propAccess.expression);
      argumentExpression = propAccess.name.getText();
    } else if (node.kind == ts.SyntaxKind.ElementAccessExpression) {
      let elemAccess = <ts.ElementAccessExpression>node;
      type = scope.root.typeVisitor.inferNodeType(elemAccess.expression);
      if (elemAccess.expression.kind == ts.SyntaxKind.Identifier)
        elementAccess = elemAccess.expression.getText();
      else elementAccess = new CElementAccess(scope, elemAccess.expression);
      if (
        type instanceof StructType &&
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
      type = scope.root.typeVisitor.inferNodeType(node);
      elementAccess = CodeTemplateFactory.createForNode(scope, node);
    }

    this.simpleAccessor = new CSimpleElementAccess(
      scope,
      type,
      elementAccess,
      argumentExpression
    );
  }
}

@CodeTemplate(`
{#if isString && argumentExpression == 'length'}
    str_len({elementAccess})
{#elseif isSimpleVar || argumentExpression == null}
    {elementAccess}
{#elseif isDynamicArray && argumentExpression == 'length'}
    {elementAccess}->size
{#elseif isDynamicArray}
    {elementAccess}->data[{argumentExpression}]
{#elseif isStaticArray && argumentExpression == 'length'}
    {arrayCapacity}
{#elseif isStaticArray}
    {elementAccess}[{argumentExpression}]
{#elseif isStruct}
    {elementAccess}->{argumentExpression}
{#elseif isDict}
    DICT_GET({elementAccess}, {argumentExpression})
{#else}
    /* Unsupported element access scenario: {elementAccess} {argumentExpression} */
{/if}`)
export class CSimpleElementAccess {
  public isSimpleVar: boolean;
  public isDynamicArray: boolean = false;
  public isStaticArray: boolean = false;
  public isStruct: boolean = false;
  public isDict: boolean = false;
  public isString: boolean = false;
  public arrayCapacity: string;
  constructor(
    scope: IScope,
    type: NativeType,
    public elementAccess: CElementAccess | CSimpleElementAccess | string,
    public argumentExpression: CExpression
  ) {
    this.isSimpleVar =
      typeof type === "string" && type != UniversalType && type != PointerType;
    this.isDynamicArray = type instanceof ArrayType && type.isDynamicArray;
    this.isStaticArray = type instanceof ArrayType && !type.isDynamicArray;
    this.arrayCapacity =
      type instanceof ArrayType && !type.isDynamicArray && type.capacity + "";
    this.isDict = type instanceof DictType;
    this.isStruct = type instanceof StructType;
    this.isString = type === StringType;
    if (this.isString && this.argumentExpression == "length")
      HeaderRegistry.declareDependency(StringLengthHeaderType);
  }
}
