import {
  BottomRegistry,
  CFunction,
  CodeTemplate,
  CodeTemplateFactory,
  CProgram,
  CVariable,
  HeaderRegistry,
  INativeExpression,
  IntegerType,
  IScope,
  Plugin,
  TypeRegistry
} from "nativejs-compiler";
import * as ts from "typescript";
import { Timer0OverflowBottom } from "../bottoms/bottom-timer0-overflow";
import { Timer0HeaderType } from "../headers/timer0";

@CodeTemplate(
  `
{returnType} {name}({parameters {, }=> {this}}) {
    {variables  {    }=> {this};\n}
    {statements {    }=> {this}}
}`
)
class TimerFunction extends CFunction {
  public name: string;
  public parameters: CVariable[] = [];

  constructor(
    public root: CProgram,
    node: ts.FunctionDeclaration | ts.FunctionExpression
  ) {
    super(root, node);

    this.parameters[0] = new CVariable(
      this,
      node.parameters[0].getText(),
      IntegerType,
      {
        removeStorageSpecifier: true
      }
    );
  }
}

@CodeTemplate(``)
class Timer0Template {
  public arguments: any[] = [];
  constructor(scope: IScope, node: ts.Node) {
    const call = node as ts.CallExpression;
    const counterName = scope.root.gc.getUniqueName();
    scope.root.variables.push(
      new CVariable(scope, counterName, "volatile unsigned long", {
        initializer: "0"
      })
    );
    const value = CodeTemplateFactory.createForNode(scope, call.arguments[1]);
    scope.statements.unshift(`timer0_init(${value.resolve()});`);
    const callback = new TimerFunction(scope.root, call
      .arguments[0] as ts.FunctionExpression);
    scope.root.functions.push(callback);
    Timer0OverflowBottom.statements.push(`
      ${counterName}++;
      ${callback.name}(${counterName});
    `);
    BottomRegistry.declareDependency(Timer0OverflowBottom);
    HeaderRegistry.declareDependency(Timer0HeaderType);
  }
}

export class Timer0Plugin implements Plugin {
  public execute(scope: IScope, node: ts.Node): INativeExpression {
    const call = node as ts.CallExpression;

    return new Timer0Template(scope, node);
  }

  public processTypes(node: ts.Node) {
    TypeRegistry.declareNodeType(node, "void");
    const call = node as ts.CallExpression;
    const callback = call.arguments[0] as ts.FunctionExpression;
    TypeRegistry.declareNodeType(callback.parameters[0], IntegerType);
  }

  public matchesNode(node: ts.Node): boolean {
    if (node.kind !== ts.SyntaxKind.CallExpression) {
      return false;
    }

    const call = node as ts.CallExpression;

    return call.expression.getText() === "Timer0.onOverflow";
  }
}
