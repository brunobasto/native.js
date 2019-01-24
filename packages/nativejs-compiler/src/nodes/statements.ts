import * as ts from "typescript";
import { CProgram, IScope } from "../core/program";
import { CodeTemplate, CodeTemplateFactory } from "../core/template";
import { ArrayType, IntegerType, StructType } from "../core/types/NativeTypes";
import { AssignmentHelper } from "./assignment";
import { CElementAccess } from "./elementaccess";
import { INativeExpression } from "./expressions";
import { CString } from "./literals";
import {
  CVariable,
  CVariableDeclaration,
  CVariableDestructors
} from "./variable";

@CodeTemplate(`break;\n`, ts.SyntaxKind.BreakStatement)
export class CBreakStatement {
  constructor(scope: IScope, node: ts.BreakStatement) {}
}
@CodeTemplate(`continue;\n`, ts.SyntaxKind.ContinueStatement)
export class CContinueStatement {
  constructor(scope: IScope, node: ts.BreakStatement) {}
}
@CodeTemplate(`;\n`, ts.SyntaxKind.EmptyStatement)
export class CEmptyStatement {
  constructor(scope: IScope, node: ts.BreakStatement) {}
}

@CodeTemplate(
  `

return {expression};
`,
  ts.SyntaxKind.ReturnStatement
)
export class CReturnStatement {
  public expression: INativeExpression;
  public destructors: CVariableDestructors;
  constructor(scope: IScope, node: ts.ReturnStatement) {
    this.expression = CodeTemplateFactory.createForNode(scope, node.expression);
    this.destructors = new CVariableDestructors(scope, node);
  }
}

@CodeTemplate(
  `
if ({condition})
{thenBlock}
{#if hasElseBlock}
    else
    {elseBlock}
{/if}
`,
  ts.SyntaxKind.IfStatement
)
export class CIfStatement {
  public condition: INativeExpression;
  public thenBlock: CBlock;
  public elseBlock: CBlock;
  public hasElseBlock: boolean;
  constructor(scope: IScope, node: ts.IfStatement) {
    this.condition = CodeTemplateFactory.createForNode(scope, node.expression);
    const thenBlock = new CBlock(scope, node.thenStatement);
    this.thenBlock = thenBlock;
    this.hasElseBlock = !!node.elseStatement;
    this.elseBlock = this.hasElseBlock && new CBlock(scope, node.elseStatement);
  }
}

@CodeTemplate(
  `
while ({condition})
{block}`,
  ts.SyntaxKind.WhileStatement
)
export class CWhileStatement {
  public condition: INativeExpression;
  public block: CBlock;
  constructor(scope: IScope, node: ts.WhileStatement) {
    this.block = new CBlock(scope, node.statement);
    this.condition = CodeTemplateFactory.createForNode(scope, node.expression);
  }
}

@CodeTemplate(
  `
do
{block}
while ({condition});`,
  ts.SyntaxKind.DoStatement
)
export class CDoWhileStatement {
  public condition: INativeExpression;
  public block: CBlock;
  constructor(scope: IScope, node: ts.WhileStatement) {
    this.block = new CBlock(scope, node.statement);
    this.condition = CodeTemplateFactory.createForNode(scope, node.expression);
  }
}

@CodeTemplate(
  `
{#if varDecl}
    {varDecl}
{/if}
for ({init};{condition};{increment})
{block}`,
  ts.SyntaxKind.ForStatement
)
export class CForStatement {
  public init: INativeExpression;
  public condition: INativeExpression;
  public increment: INativeExpression;
  public block: CBlock;
  public varDecl: CVariableDeclaration = null;
  constructor(scope: IScope, node: ts.ForStatement) {
    this.block = new CBlock(scope, node.statement);
    if (node.initializer.kind === ts.SyntaxKind.VariableDeclarationList) {
      const declList = node.initializer as ts.VariableDeclarationList;
      this.varDecl = new CVariableDeclaration(scope, declList.declarations[0]);
      this.init = "";
    } else {
      this.init = CodeTemplateFactory.createForNode(scope, node.initializer);
    }
    this.condition = CodeTemplateFactory.createForNode(scope, node.condition);
    this.increment = CodeTemplateFactory.createForNode(scope, node.incrementor);
  }
}

@CodeTemplate(
  `
{#if isDynamicArray}
    for ({iteratorVarName} = 0; {iteratorVarName} < {arrayAccess}->size; {iteratorVarName}++)
    {
        {init} = {cast}{arrayAccess}->data[{iteratorVarName}];
        {statements {    }=> {this}}
    }
{#else}
    for ({iteratorVarName} = 0; {iteratorVarName} < {arrayCapacity}; {iteratorVarName}++)
    {
        {init} = {cast}{arrayAccess}[{iteratorVarName}];
        {statements {    }=> {this}}
    }
{/if}
`,
  ts.SyntaxKind.ForOfStatement
)
export class CForOfStatement implements IScope {
  public init: INativeExpression;
  public iteratorVarName: string;
  public variables: CVariable[] = [];
  public statements: any[] = [];
  public parent: IScope;
  public func: IScope;
  public root: CProgram;
  public isDynamicArray: boolean;
  public arrayAccess: CElementAccess;
  public arrayCapacity: string;
  public cast: string = "";
  constructor(scope: IScope, node: ts.ForOfStatement) {
    this.parent = scope;
    this.func = scope.func;
    this.root = scope.root;
    this.iteratorVarName = scope.root.temporaryVariables.addNewIteratorVariable(
      node
    );
    scope.variables.push(
      new CVariable(scope, this.iteratorVarName, IntegerType)
    );
    this.arrayAccess = new CElementAccess(scope, node.expression);
    const arrayVarType = scope.root.typeVisitor.inferNodeType(node.expression);
    if (arrayVarType && arrayVarType instanceof ArrayType) {
      this.isDynamicArray = arrayVarType.isDynamicArray;
      this.arrayCapacity = arrayVarType.capacity + "";
      const elemType = arrayVarType.elementType;
      if (elemType instanceof ArrayType && elemType.isDynamicArray) {
        this.cast = "(void *)";
      }
    }
    if (node.initializer.kind === ts.SyntaxKind.VariableDeclarationList) {
      const declInit = (node.initializer as ts.VariableDeclarationList)
        .declarations[0];
      scope.variables.push(
        new CVariable(scope, declInit.name.getText(), declInit.name)
      );
      this.init = declInit.name.getText();
    } else {
      this.init = new CElementAccess(scope, node.initializer);
    }
    this.statements.push(
      CodeTemplateFactory.createForNode(this, node.statement)
    );
    scope.variables = scope.variables.concat(this.variables);
    this.variables = [];
  }
}

@CodeTemplate(
  `
for ({iteratorVarName} = 0; {iteratorVarName} < {varAccess}->index->size; {iteratorVarName}++)
{
    {variables {    }=> {this};\n}
    {init} = {varAccess}->index->data[{iteratorVarName}];
    {statements {    }=> {this}}
}
`,
  ts.SyntaxKind.ForInStatement
)
export class CForInStatement implements IScope {
  public variables: CVariable[] = [];
  public statements: any[] = [];
  public parent: IScope;
  public func: IScope;
  public root: CProgram;
  public iteratorVarName: string;
  public varAccess: CElementAccess;
  public init: CElementAccess | string;
  constructor(scope: IScope, node: ts.ForInStatement) {
    this.parent = scope;
    this.func = scope.func;
    this.root = scope.root;
    this.iteratorVarName = scope.root.temporaryVariables.addNewIteratorVariable(
      node
    );
    scope.variables.push(
      new CVariable(scope, this.iteratorVarName, IntegerType)
    );
    this.varAccess = new CElementAccess(scope, node.expression);
    const dictVarType = scope.root.typeVisitor.inferNodeType(node.expression);
    // TODO: do something with dictVarType

    if (node.initializer.kind === ts.SyntaxKind.VariableDeclarationList) {
      const declInit = (node.initializer as ts.VariableDeclarationList)
        .declarations[0];
      scope.variables.push(
        new CVariable(scope, declInit.name.getText(), declInit.name)
      );
      this.init = declInit.name.getText();
    } else {
      this.init = new CElementAccess(scope, node.initializer);
    }

    if (node.statement.kind === ts.SyntaxKind.Block) {
      const block = node.statement as ts.Block;
      for (const s of block.statements) {
        this.statements.push(CodeTemplateFactory.createForNode(this, s));
      }
    } else {
      this.statements.push(
        CodeTemplateFactory.createForNode(this, node.statement)
      );
    }
    // scope.variables = scope.variables.concat(this.variables);

    scope.root.gc.addScopeTemporaries(this, node);
  }
}

class CProperty {
  constructor(
    public varAccess: CElementAccess,
    public index: string,
    public name: CString,
    public init: INativeExpression
  ) {}
}

@CodeTemplate(`{expression}{SemicolonCR}`, ts.SyntaxKind.ExpressionStatement)
export class INativeExpressionStatement {
  public expression: INativeExpression;
  public SemicolonCR: string = ";\n";
  constructor(scope: IScope, node: ts.ExpressionStatement) {
    if (node.expression.kind === ts.SyntaxKind.BinaryExpression) {
      const binExpr = node.expression as ts.BinaryExpression;
      if (binExpr.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        this.expression = AssignmentHelper.create(
          scope,
          binExpr.left,
          binExpr.right
        );
        this.SemicolonCR = "";
      }
    }
    if (!this.expression) {
      this.expression = CodeTemplateFactory.createForNode(
        scope,
        node.expression
      );
    }
  }
}

@CodeTemplate(
  `
{#if statements.length > 1 || variables.length > 0}
    {
        {variables {    }=> {this};\n}
        {statements {    }=> {this}}
    }
{/if}
{#if statements.length === 1 && variables.length === 0}
        {statements}
{/if}
{#if statements.length === 0 && variables.length === 0}
        /* no statements */;
{/if}`,
  ts.SyntaxKind.Block
)
export class CBlock implements IScope {
  public variables: CVariable[] = [];
  public statements: any[] = [];
  public parent: IScope;
  public func: IScope;
  public root: CProgram;
  constructor(scope: IScope, node: ts.Statement) {
    this.parent = scope;
    this.func = scope.func;
    this.root = scope.root;

    if (node.kind === ts.SyntaxKind.Block) {
      const block = node as ts.Block;
      block.statements.forEach(s =>
        this.statements.push(CodeTemplateFactory.createForNode(this, s))
      );
    } else {
      this.statements.push(CodeTemplateFactory.createForNode(this, node));
    }
    scope.root.gc.addScopeTemporaries(this, node);
  }
}
