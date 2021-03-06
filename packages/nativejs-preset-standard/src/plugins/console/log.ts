import {
  ArrayType,
  BooleanType,
  CCallExpression,
  CodeTemplate,
  CodeTemplateFactory,
  CVariable,
  DictType,
  FloatType,
  INativeExpression,
  IntegerType,
  IScope,
  LongType,
  NativeType,
  RegexType,
  StringType,
  StructType,
  VariableInfo
} from "nativejs-compiler";
import * as ts from "typescript";
import { Expression } from "typescript";
import { NodeArray } from "typescript";

export class ConsoleLogHelper {
  public static create(scope: IScope, printNodes: NodeArray<Expression>) {
    const printfs = [];
    for (let i = 0; i < printNodes.length; i++) {
      const printNode = printNodes[i];
      const type = scope.root.typeVisitor.inferNodeType(printNode);
      let nodeExpressions = processBinaryExpressions(scope, printNode);

      let stringLit = "";
      nodeExpressions = nodeExpressions.reduce((a, c) => {
        if (c.node.kind === ts.SyntaxKind.StringLiteral) {
          stringLit += c.expression.resolve().slice(1, -1);
        } else {
          a.push(c);
          c.prefix = stringLit;
          stringLit = "";
        }
        return a;
      }, []);
      if (stringLit) {
        if (nodeExpressions.length) {
          nodeExpressions[nodeExpressions.length - 1].postfix = stringLit;
        } else {
          nodeExpressions.push({
            expression: stringLit,
            node: printNode,
            postfix: "",
            prefix: ""
          });
        }
      }

      for (let j = 0; j < nodeExpressions.length; j++) {
        const { node, expression, prefix, postfix } = nodeExpressions[j];
        const accessor = expression.resolve ? expression.resolve() : expression;
        const options = {
          postfix:
            postfix +
            (i === printNodes.length - 1 && j === nodeExpressions.length - 1
              ? "\\n"
              : ""),
          prefix: (i > 0 && j === 0 ? " " : "") + prefix
        };
        printfs.push(new CPrintf(scope, node, accessor, type, options));
      }
    }
    return printfs;
  }
}

function processBinaryExpressions(scope: IScope, printNode: ts.Node) {
  const type = scope.root.typeVisitor.inferNodeType(printNode);
  if (
    type === StringType &&
    printNode.kind === ts.SyntaxKind.BinaryExpression
  ) {
    const binExpr = printNode as ts.BinaryExpression;
    if (
      scope.root.typeVisitor.inferNodeType(binExpr.left) === StringType &&
      scope.root.typeVisitor.inferNodeType(binExpr.right) === StringType
    ) {
      const left = processBinaryExpressions(scope, binExpr.left);
      const right = processBinaryExpressions(scope, binExpr.right);
      return [].concat(left, right);
    }
  }

  return [
    {
      expression: CodeTemplateFactory.createForNode(scope, printNode),
      node: printNode,
      postfix: "",
      prefix: ""
    }
  ];
}

interface IPrintfOptions {
  prefix?: string;
  postfix?: string;
  quotedString?: boolean;
  propName?: string;
  indent?: string;
}

@CodeTemplate(`
{#if isStringLiteral}
    printf("{PREFIX}{accessor}{POSTFIX}");
{#elseif isQuotedCString}
    printf("{PREFIX}\\"%s\\"{POSTFIX}", {accessor});
{#elseif isCString}
    printf("{PREFIX}%s{POSTFIX}", {accessor});
{#elseif isRegex}
    printf("{PREFIX}%s{POSTFIX}", {accessor}.str);
{#elseif isInteger}
    printf("{PREFIX}%d{POSTFIX}", {accessor});
{#elseif isFloat}
    printf("{PREFIX}%.6f{POSTFIX}", {accessor});
{#elseif isLong}
    printf("{PREFIX}%lu{POSTFIX}", {accessor});
{#elseif isBoolean && !PREFIX && !POSTFIX}
    printf({accessor} ? "true" : "false");
{#elseif isBoolean && (PREFIX || POSTFIX)}
    printf("{PREFIX}%s{POSTFIX}", {accessor} ? "true" : "false");
{#elseif isDict}
    printf("{PREFIX}{ ");
    {INDENT}for ({iteratorVarName} = 0; {iteratorVarName} < {accessor}->index->size; {iteratorVarName}++) {
    {INDENT}    if ({iteratorVarName} != 0)
    {INDENT}        printf(", ");
    {INDENT}    printf("\\"%s\\": ", {accessor}->index->data[{iteratorVarName}]);
    {INDENT}    {elementPrintfs}
    {INDENT}}
    {INDENT}printf(" }{POSTFIX}");
{#elseif isStruct}
    printf("{PREFIX}{ ");
    {INDENT}{elementPrintfs {    printf(", ");\n    }=> {this}}
    {INDENT}printf(" }{POSTFIX}");
{#elseif isArray}
    printf("{PREFIX}[ ");
    {INDENT}for ({iteratorVarName} = 0; {iteratorVarName} < {arraySize}; {iteratorVarName}++) {
    {INDENT}    if ({iteratorVarName} != 0)
    {INDENT}        printf(", ");
    {INDENT}    {elementPrintfs}
    {INDENT}}
    {INDENT}printf(" ]{POSTFIX}");
{#else}
    printf(/* Unsupported printf expression */);
{/if}`)
class CPrintf {
  public isArray: boolean = false;
  public isBoolean: boolean = false;
  public isCString: boolean = false;
  public isDict: boolean = false;
  public isFloat: boolean = false;
  public isInteger: boolean = false;
  public isLong: boolean = false;
  public isQuotedCString: boolean = false;
  public isRegex: boolean = false;
  public isStringLiteral: boolean = false;
  public isStruct: boolean = false;

  public arraySize: string;
  public elementPrintfs: CPrintf[] = [];
  public INDENT: string = "";
  public iteratorVarName: string;
  public POSTFIX: string;
  public PREFIX: string;
  public propPrefix: string = "";

  constructor(
    scope: IScope,
    printNode: ts.Node,
    public accessor: string,
    varType: NativeType,
    options: IPrintfOptions
  ) {
    this.isStringLiteral =
      varType === StringType && printNode.kind === ts.SyntaxKind.StringLiteral;
    this.isBoolean = varType === BooleanType;
    this.isCString = varType === StringType && !options.quotedString;
    this.isFloat = varType === FloatType;
    this.isInteger = varType === IntegerType;
    this.isLong = varType === LongType;
    this.isQuotedCString = varType === StringType && options.quotedString;
    this.isRegex = varType === RegexType;

    this.PREFIX = options.prefix || "";
    this.POSTFIX = options.postfix || "";

    if (options.propName) {
      this.PREFIX = `${this.PREFIX}\\"${options.propName}\\": `;
    }

    if (options.indent) {
      this.INDENT = options.indent;
    }

    if (varType instanceof ArrayType) {
      this.isArray = true;
      this.iteratorVarName = scope.root.temporaryVariables.addNewIteratorVariable(
        printNode
      );
      scope.variables.push(
        new CVariable(scope, this.iteratorVarName, IntegerType)
      );
      this.arraySize = varType.isDynamicArray
        ? accessor + "->size"
        : varType.capacity + "";
      const elementAccessor =
        accessor +
        (varType.isDynamicArray ? "->data" : "") +
        "[" +
        this.iteratorVarName +
        "]";
      const opts = { quotedString: true, indent: this.INDENT + "    " };
      this.elementPrintfs = [
        new CPrintf(
          scope,
          printNode,
          elementAccessor,
          varType.elementType,
          opts
        )
      ];
    } else if (varType instanceof DictType) {
      this.isDict = true;
      this.iteratorVarName = scope.root.temporaryVariables.addNewIteratorVariable(
        printNode
      );
      scope.variables.push(
        new CVariable(scope, this.iteratorVarName, IntegerType)
      );
      const opts = { quotedString: true, indent: this.INDENT + "    " };
      this.elementPrintfs = [
        new CPrintf(
          scope,
          printNode,
          accessor + "->values->data[" + this.iteratorVarName + "]",
          varType.elementType,
          opts
        )
      ];
    } else if (varType instanceof StructType) {
      this.isStruct = true;
      for (const k of Object.keys(varType.properties)) {
        const propAccessor = accessor + "->" + k;
        const opts = {
          indent: this.INDENT + "    ",
          propName: k,
          quotedString: true
        };
        this.elementPrintfs.push(
          new CPrintf(
            scope,
            printNode,
            propAccessor,
            varType.properties[k],
            opts
          )
        );
      }
    }
  }
}
