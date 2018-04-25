import { AssignmentHelper, CAssignment } from "./assignment";
import * as ts from "typescript";
import { CodeTemplate, CodeTemplateFactory } from "../core/template";
import {
  HeaderRegistry,
  ArrayPushHeaderType,
  StringHeaderType,
  StdlibHeaderType,
  AssertHeaderType,
  StringAndIntCompareHeaderType,
  StringAndIntConcatHeaderType
} from "../core/header";
import { IScope } from "../core/program";
import {
  NativeType,
  ArrayType,
  StructType,
  StringType,
  RegexType,
  IntegerType,
  BooleanType,
  UniversalType,
  PointerType,
  isNumericType
} from "../core/types/NativeTypes";
import { CVariable } from "./variable";
import { CElementAccess } from "./elementaccess";
import { CRegexAsString } from "./regexfunc";
export interface CExpression {}

@CodeTemplate(`{expression}`, ts.SyntaxKind.BinaryExpression)
class CBinaryExpression {
  public expression: CExpression;
  constructor(scope: IScope, node: ts.BinaryExpression) {
    if (node.operatorToken.kind === ts.SyntaxKind.FirstAssignment) {
      this.expression = AssignmentHelper.create(
        scope,
        node.left,
        node.right,
        true
      );
      return;
    }
    if (node.operatorToken.kind === ts.SyntaxKind.CommaToken) {
      let nodeAsStatement = <ts.ExpressionStatement>ts.createNode(
        ts.SyntaxKind.ExpressionStatement
      );
      nodeAsStatement.expression = node.left;
      nodeAsStatement.parent = node.getSourceFile();
      scope.statements.push(
        CodeTemplateFactory.createForNode(scope, nodeAsStatement)
      );
      this.expression = CodeTemplateFactory.createForNode(scope, node.right);
      return;
    }

    let leftType = scope.root.typeVisitor.inferNodeType(node.left);
    let left = CodeTemplateFactory.createForNode(scope, node.left);
    let rightType = scope.root.typeVisitor.inferNodeType(node.right);
    let right = CodeTemplateFactory.createForNode(scope, node.right);
    this.expression = new CSimpleBinaryExpression(
      scope,
      left,
      leftType,
      right,
      rightType,
      node.operatorToken.kind,
      node
    );
  }
}

@CodeTemplate(`
{#statements}
    {#if replacedWithVar && strPlusStr}
        {replacementVarName} = malloc(strlen({left}) + strlen({right}) + 1);
        assert({replacementVarName} != NULL);
        strcpy({replacementVarName}, {left});
        strcat({replacementVarName}, {right});
    {#elseif replacedWithVar && strPlusNumber}
        {replacementVarName} = malloc(strlen({left}) + STR_INT16_T_BUFLEN + 1);
        assert({replacementVarName} != NULL);
        {replacementVarName}[0] = '\\0';
        strcat({replacementVarName}, {left});
        str_int16_t_cat({replacementVarName}, {right});
    {#elseif replacedWithVar && numberPlusStr}
        {replacementVarName} = malloc(strlen({right}) + STR_INT16_T_BUFLEN + 1);
        assert({replacementVarName} != NULL);
        {replacementVarName}[0] = '\\0';
        str_int16_t_cat({replacementVarName}, {left});
        strcat({replacementVarName}, {right});
    {/if}
{/statements}
{#if operator}
    {left} {operator} {right}
{#elseif replacedWithCall}
    {call}({left}, {right}){callCondition}
{#elseif replacedWithVarAssignment}
    ({left} = {replacementVarName})
{#elseif replacedWithVar}
    {replacementVarName}
{#else}
    /* unsupported expression {nodeText} */
{/if}`)
export class CSimpleBinaryExpression {
  public nodeText: string;
  public operator: string;
  public replacedWithCall: boolean = false;
  public call: string;
  public callCondition: string;
  public replacedWithVar: boolean = false;
  public replacedWithVarAssignment: boolean = false;
  public replacementVarName: string;
  public gcVarName: string = null;
  public strPlusStr: boolean = false;
  public strPlusNumber: boolean = false;
  public numberPlusStr: boolean = false;
  constructor(
    scope: IScope,
    public left: CExpression,
    leftType: NativeType,
    public right: CExpression,
    rightType: NativeType,
    operatorKind: ts.SyntaxKind,
    node: ts.Node
  ) {
    let operatorMap: { [token: number]: string } = {};
    let callReplaceMap: { [token: number]: [string, string] } = {};

    if (leftType === RegexType && operatorKind === ts.SyntaxKind.PlusToken) {
      leftType = StringType;
      this.left = new CRegexAsString(left);
    }
    if (rightType === RegexType && operatorKind === ts.SyntaxKind.PlusToken) {
      rightType = StringType;
      this.right = new CRegexAsString(right);
    }

    operatorMap[ts.SyntaxKind.AmpersandAmpersandToken] = "&&";
    operatorMap[ts.SyntaxKind.BarBarToken] = "||";
    const typeVisitor = scope.root.typeVisitor;
    if (isNumericType(leftType) && isNumericType(rightType)) {
      this.addNumberOperators(operatorMap);
    } else if (leftType === StringType && rightType === StringType) {
      callReplaceMap[ts.SyntaxKind.ExclamationEqualsEqualsToken] = [
        "strcmp",
        " != 0"
      ];
      callReplaceMap[ts.SyntaxKind.ExclamationEqualsToken] = [
        "strcmp",
        " != 0"
      ];
      callReplaceMap[ts.SyntaxKind.EqualsEqualsEqualsToken] = [
        "strcmp",
        " == 0"
      ];
      callReplaceMap[ts.SyntaxKind.EqualsEqualsToken] = ["strcmp", " == 0"];

      if (callReplaceMap[operatorKind]) {
        HeaderRegistry.declareDependency(AssertHeaderType);
        HeaderRegistry.declareDependency(StdlibHeaderType);
        HeaderRegistry.declareDependency(StringHeaderType);
      }

      if (
        operatorKind === ts.SyntaxKind.PlusToken ||
        operatorKind === ts.SyntaxKind.FirstCompoundAssignment
      ) {
        this.replaceWithVar(scope, node, operatorKind, StringType);
        this.strPlusStr = true;
        HeaderRegistry.declareDependency(AssertHeaderType);
        HeaderRegistry.declareDependency(StdlibHeaderType);
        HeaderRegistry.declareDependency(StringHeaderType);
      }
    } else if (
      (leftType === IntegerType && rightType === StringType) ||
      (leftType === StringType && rightType === IntegerType)
    ) {
      callReplaceMap[ts.SyntaxKind.ExclamationEqualsEqualsToken] = [
        "str_int16_t_cmp",
        " != 0"
      ];
      callReplaceMap[ts.SyntaxKind.ExclamationEqualsToken] = [
        "str_int16_t_cmp",
        " != 0"
      ];
      callReplaceMap[ts.SyntaxKind.EqualsEqualsEqualsToken] = [
        "str_int16_t_cmp",
        " == 0"
      ];
      callReplaceMap[ts.SyntaxKind.EqualsEqualsToken] = [
        "str_int16_t_cmp",
        " == 0"
      ];

      if (callReplaceMap[operatorKind]) {
        HeaderRegistry.declareDependency(StdlibHeaderType);
        HeaderRegistry.declareDependency(AssertHeaderType);
        HeaderRegistry.declareDependency(StringAndIntCompareHeaderType);
        // str_int16_t_cmp expects certain order of arguments (string, number)
        if (leftType === IntegerType) {
          let tmp = this.left;
          this.left = this.right;
          this.right = tmp;
        }
      }

      if (
        operatorKind === ts.SyntaxKind.PlusToken ||
        operatorKind === ts.SyntaxKind.FirstCompoundAssignment
      ) {
        this.replaceWithVar(scope, node, operatorKind, StringType);
        if (leftType === IntegerType) {
          this.numberPlusStr = true;
        } else {
          this.strPlusNumber = true;
        }
        HeaderRegistry.declareDependency(AssertHeaderType);
        HeaderRegistry.declareDependency(StdlibHeaderType);
        HeaderRegistry.declareDependency(StringHeaderType);
        HeaderRegistry.declareDependency(StringAndIntConcatHeaderType);
      }
    }
    this.operator = operatorMap[operatorKind];
    if (callReplaceMap[operatorKind]) {
      this.replacedWithCall = true;
      [this.call, this.callCondition] = callReplaceMap[operatorKind];
    }
    this.nodeText = node.getText();
  }

  private addNumberOperators(operatorMap) {
    operatorMap[ts.SyntaxKind.GreaterThanToken] = ">";
    operatorMap[ts.SyntaxKind.GreaterThanEqualsToken] = ">=";
    operatorMap[ts.SyntaxKind.LessThanToken] = "<";
    operatorMap[ts.SyntaxKind.LessThanEqualsToken] = "<=";
    operatorMap[ts.SyntaxKind.ExclamationEqualsEqualsToken] = "!=";
    operatorMap[ts.SyntaxKind.ExclamationEqualsToken] = "!=";
    operatorMap[ts.SyntaxKind.EqualsEqualsEqualsToken] = "==";
    operatorMap[ts.SyntaxKind.EqualsEqualsToken] = "==";
    operatorMap[ts.SyntaxKind.AsteriskToken] = "*";
    operatorMap[ts.SyntaxKind.SlashToken] = "/";
    operatorMap[ts.SyntaxKind.PercentToken] = "%";
    operatorMap[ts.SyntaxKind.PlusToken] = "+";
    operatorMap[ts.SyntaxKind.MinusToken] = "-";
    operatorMap[ts.SyntaxKind.FirstCompoundAssignment] = "+=";
    operatorMap[ts.SyntaxKind.MinusEqualsToken] = "-=";
    operatorMap[ts.SyntaxKind.AmpersandToken] = "&";
    operatorMap[ts.SyntaxKind.BarToken] = "|";
    operatorMap[ts.SyntaxKind.CaretToken] = "^";
    operatorMap[ts.SyntaxKind.GreaterThanGreaterThanToken] = ">>";
    operatorMap[ts.SyntaxKind.LessThanLessThanToken] = "<<";
    operatorMap[ts.SyntaxKind.SlashEqualsToken] = "/=";
    operatorMap[ts.SyntaxKind.AsteriskEqualsToken] = "*=";
  }

  private replaceWithVar(
    scope: IScope,
    node: ts.Node,
    operatorKind,
    type: string
  ) {
    // experimental gc
    const temporaryVariable = scope.root.gc.createTemporaryVariable(node, type);
    // this.gcVarName = scope.root.memoryManager.getGCVariableForNode(node);
    this.replacedWithVar = true;
    this.replacedWithVarAssignment =
      operatorKind === ts.SyntaxKind.FirstCompoundAssignment;
    this.replacementVarName = temporaryVariable;
  }
}

@CodeTemplate(
  `
{#if isPostfix && operator}
    {operand}{operator}
{#elseif !isPostfix && operator}
    {operator}{operand}
{#elseif replacedWithCall}
    {call}({operand}){callCondition}
{#else}
    /* unsupported expression {nodeText} */
{/if}`,
  [ts.SyntaxKind.PrefixUnaryExpression, ts.SyntaxKind.PostfixUnaryExpression]
)
class CUnaryExpression {
  public nodeText: string;
  public operator: string;
  public operand: CExpression;
  public isPostfix: boolean;
  public replacedWithCall: boolean = false;
  public call: string;
  public callCondition: string;
  constructor(
    scope: IScope,
    node: ts.PostfixUnaryExpression | ts.PrefixUnaryExpression
  ) {
    let operatorMap: { [token: number]: string } = {};
    let callReplaceMap: { [token: number]: [string, string] } = {};
    let type = scope.root.typeVisitor.inferNodeType(node.operand);
    operatorMap[ts.SyntaxKind.ExclamationToken] = "!";
    const typeVisitor = scope.root.typeVisitor;
    if (isNumericType(type)) {
      operatorMap[ts.SyntaxKind.PlusPlusToken] = "++";
      operatorMap[ts.SyntaxKind.MinusMinusToken] = "--";
      operatorMap[ts.SyntaxKind.MinusToken] = "-";
      operatorMap[ts.SyntaxKind.PlusToken] = "+";
      operatorMap[ts.SyntaxKind.TildeToken] = "~";
    }
    if (type === StringType) {
      callReplaceMap[ts.SyntaxKind.PlusToken] = ["atoi", ""];
      if (callReplaceMap[node.operator]) scope.root.headerFlags.atoi = true;
    }
    this.operator = operatorMap[node.operator];
    if (callReplaceMap[node.operator]) {
      this.replacedWithCall = true;
      [this.call, this.callCondition] = callReplaceMap[node.operator];
    }
    this.operand = CodeTemplateFactory.createForNode(scope, node.operand);
    this.isPostfix = node.kind === ts.SyntaxKind.PostfixUnaryExpression;
    this.nodeText = node.getText();
  }
}

@CodeTemplate(
  `{condition} ? {whenTrue} : {whenFalse}`,
  ts.SyntaxKind.ConditionalExpression
)
class CTernaryExpression {
  public condition: CExpression;
  public whenTrue: CExpression;
  public whenFalse: CExpression;
  constructor(scope: IScope, node: ts.ConditionalExpression) {
    this.condition = CodeTemplateFactory.createForNode(scope, node.condition);
    this.whenTrue = CodeTemplateFactory.createForNode(scope, node.whenTrue);
    this.whenFalse = CodeTemplateFactory.createForNode(scope, node.whenFalse);
  }
}

@CodeTemplate(`({expression})`, ts.SyntaxKind.ParenthesizedExpression)
class CGroupingExpression {
  public expression: CExpression;
  constructor(scope: IScope, node: ts.ParenthesizedExpression) {
    this.expression = CodeTemplateFactory.createForNode(scope, node.expression);
  }
}
