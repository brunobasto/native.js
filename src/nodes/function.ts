import * as ts from "typescript";
import { ArrayType, StringVarType, NumberVarType, TypeHelper } from "../types";
import { CodeTemplate, CodeTemplateFactory } from "../template";
import { CVariable, CVariableDestructors } from "./variable";
import { IScope, CProgram } from "../program";
import { StandardCallResolver, IResolver } from "../resolver";
import { CExpression } from "./expressions";
import { StandardCallHelper } from "../resolver";

@CodeTemplate(`{returnType} {name}({parameters {, }=> {this}});`)
export class CFunctionPrototype {
  public returnType: string;
  public name: string;
  public parameters: CVariable[] = [];
  constructor(scope: IScope, node: ts.FunctionDeclaration) {
    this.returnType = scope.root.typeHelper.getTypeString(node);

    this.name = node.name.getText();
    this.parameters = node.parameters.map(
      p =>
        new CVariable(scope, p.name.getText(), p.name, {
          removeStorageSpecifier: true
        })
    );
  }
}

@CodeTemplate(
  `
{returnType} {name}({parameters {, }=> {this}}) {
    {variables  {    }=> {this};\n}
    {statements {    }=> {this}}
}`,
  ts.SyntaxKind.FunctionDeclaration
)
export class CFunction implements IScope {
  public parent: IScope;
  public func = this;
  public returnType: string;
  public name: string;
  public parameters: CVariable[] = [];
  public variables: CVariable[] = [];
  public statements: any[] = [];
  public gcVarNames: string[];
  public destructors: CVariableDestructors;

  constructor(
    public root: CProgram,
    node: ts.FunctionDeclaration | ts.FunctionExpression
  ) {
    this.parent = root;
    this.returnType = root.typeHelper.getTypeString(node);

    if (node.name) {
      this.name = node.name.getText();
    } else {
      const uniqueName = this.root.gc.getUniqueName();
      this.name = `${uniqueName}AnonymousFunction`;
    }
    this.parameters = node.parameters.map(p => {
      return new CVariable(this, p.name.getText(), p.name, {
        removeStorageSpecifier: true
      });
    });
    this.variables = [];
    node.body.statements.forEach(s =>
      this.statements.push(CodeTemplateFactory.createForNode(this, s))
    );
    if (
      node.body.statements[node.body.statements.length - 1].kind !=
      ts.SyntaxKind.ReturnStatement
    ) {
      this.destructors = new CVariableDestructors(this, node);
    }
  }
}
