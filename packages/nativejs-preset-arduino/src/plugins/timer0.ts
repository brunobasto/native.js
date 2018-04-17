import * as ts from "typescript";
import {
  BottomRegistry,
  CExpression,
  CFunction,
  CodeTemplate,
  CodeTemplateFactory,
  CProgram,
  CVariable,
  HeaderRegistry,
  IScope,
  NumberVarType,
  Plugin,
  TypeRegistry
} from "nativejs-compiler";
import { Timer0HeaderType } from "../headers/timer0";
import { Timer0OverflowBottom } from "../bottoms/bottom-timer0-overflow";

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
      NumberVarType,
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
    const call = <ts.CallExpression>node;
    const counterName = scope.root.gc.getUniqueName();
    scope.root.variables.push(
      new CVariable(scope, counterName, "volatile unsigned long", {
        initializer: "0"
      })
    );
    const value = CodeTemplateFactory.createForNode(scope, call.arguments[1]);
    scope.statements.unshift(`timer0_init(${value["resolve"]()});`);
    const callback = new TimerFunction(scope.root, <ts.FunctionExpression>call
      .arguments[0]);
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
  execute(scope: IScope, node: ts.Node, handler: Object): CExpression {
    const call = <ts.CallExpression>node;

    return new Timer0Template(scope, node);
  }

  processTypes(node: ts.Node) {
    TypeRegistry.declareNodeType(node, "void");
    const call = <ts.CallExpression>node;
    const callback = <ts.FunctionExpression>call.arguments[0];
    TypeRegistry.declareNodeType(callback.parameters[0], NumberVarType);
  }

  matchesNode(node: ts.Node): boolean {
    if (node.kind != ts.SyntaxKind.CallExpression) {
      return false;
    }

    const call = <ts.CallExpression>node;

    return call.expression.getText() == "Timer0.onOverflow";
  }
}
