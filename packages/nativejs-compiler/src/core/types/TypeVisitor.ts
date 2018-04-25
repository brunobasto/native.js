import debug from "debug";
import * as ts from "typescript";
import { PluginRegistry } from "../PluginRegistry";
import { CProgram } from "../program";
import { ScopeUtil } from "../scope/ScopeUtil";
import {
  ArrayType,
  BooleanType,
  DictType,
  FloatType,
  IntegerType,
  NativeType,
  PointerType,
  StringType,
  StructType,
  UniversalType
} from "./NativeTypes";
import { PropertiesDictionary } from "./PropertiesDictionary";
import { Structures } from "./Structures";
import { TypeInferencer } from "./TypeInferencer";

const log = debug("types");

/** Information about a variable */
export class VariableInfo {
  /** Name of the variable */
  public name: string;
  /** The final determined C type for this variable */
  public type: NativeType;
  /** Contains all references to this variable */
  public references: ts.Node[] = [];
  /** Where variable was declared */
  public declaration: ts.Node;
  /** Determines if the variable requires memory allocation */
  public requiresAllocation: boolean;
}

// forOfIterator ====> for <var> of <array_variable> ---> <var>.type = (type of <array_variable>).elementType
// forInIterator ====> for <var> in <dict_variable> ---> <var>.type = StringType
// dynamicArrayOf ====> <var>.push(<value>) ---> <var>.elementType = (type of <value>)
// propertyType ====> <var>[<string>] = <value> ---> <var>.properties[<string>] = (type of <value>)
// propertyType ====> <var>.<ident> = <value> ---> <var>.properties[<ident>] = (type of <value>)
// arrayOf ====> <var>[<number>] = <value> ---> <var>.elementType = (type of <value>)
// dictOf ====> <var>[<something>] = <value> ---> <var>.elementType = (type of <value>)

enum TypePromiseKind {
  variable,
  forOfIterator,
  forInIterator,
  propertyType,
  dynamicArrayOf,
  arrayOf,
  dictOf,
  void
}

class TypePromise {
  public bestType: NativeType;
  constructor(
    public associatedNode: ts.Node,
    public promiseKind: TypePromiseKind = TypePromiseKind.variable,
    public propertyName: string = null
  ) {}
}

interface PromiseDictionary { [promiseId: string]: TypePromise; }

class VariableData {
  public addedProperties: { [propName: string]: NativeType } = {};
  public arrLiteralAssigned: boolean = false;
  public isDict: boolean;
  public isDynamicArray: boolean;
  public parameterFuncDeclPos: number;
  public parameterIndex: number;
  public typePromises: { [id: string]: TypePromise } = {};
  public wasObjectLiteralAssigned: boolean = false;
  /** references to variables that represent properties of this variable */
  public varDeclPosByPropName: { [propName: string]: number } = {};
  /** for debugging: log of how the type of this variable was determined */
  public typeResolutionLog: any[] = [];
}

export class TypeVisitor {
  private variablesData: { [varDeclPos: number]: VariableData } = {};
  private functionCallsData: {
    [funcDeclPos: number]: PromiseDictionary[];
  } = {};

  public variables: { [varDeclPos: number]: VariableInfo } = {};
  private arrayLiteralsTypes: { [litArrayPos: number]: NativeType } = {};
  private objectLiteralsTypes: { [litObjectPos: number]: NativeType } = {};

  private structures: Structures;
  private typeInferencer: TypeInferencer;
  private typeChecker: ts.TypeChecker;

  constructor(private program: CProgram) {
    this.structures = new Structures(program.typeChecker, this);
    this.typeChecker = program.typeChecker;
    this.typeInferencer = program.typeInferencer;
  }

  public inferNodeType(node: ts.Node) {
    return this.typeInferencer.inferNodeType(node);
  }

  /** Performs initialization of variables array */
  /** Call this before using getVariableInfo */
  public visit(sources: ts.SourceFile[]) {
    for (const source of sources) {
      this.visitNode(source);
    }

    this.resolvePromisesAndFinalizeTypes();
  }

  public ensureArrayStruct(elementType: NativeType) {
    const elementTypeText = this.getTypeString(elementType);
    // if (elementType instanceof ArrayType) {
    //   elementTypeText =
    //     this.getTypeString(<ArrayType>elementType.elementType) + " * ";
    // }
    const name = ArrayType.getArrayStructName(elementTypeText);
    const struct = new StructType(name, {
      size: IntegerType,
      capacity: IntegerType,
      data: elementTypeText + "*"
    });

    this.structures.declare(name, struct);
  }

  /** Get information of variable specified by ts.Node */
  public getVariableInfo(node: ts.Node, propKey?: string): VariableInfo {
    const symbol = this.typeChecker.getSymbolAtLocation(node);
    const varPos =
      symbol && symbol.valueDeclaration
        ? symbol.valueDeclaration.pos
        : node.pos;
    let varInfo = this.variables[varPos];
    if (varInfo && propKey) {
      const propPos = this.variablesData[varPos].varDeclPosByPropName[propKey];
      varInfo = this.variables[propPos];
    }
    return varInfo;
  }

  /** Get textual representation of type of the parameter for inserting into the C code */
  public getTypeString(source) {
    if (source.flags != null && source.intrinsicName != null) {
      // ts.Type
      source = this.convertType(source);
    } else if (
      source.flags != null &&
      source.callSignatures != null &&
      source.constructSignatures != null
    ) {
      // ts.Type
      source = this.convertType(source);
    } else if (source.kind != null && source.flags != null) {
      // ts.Node
      source = this.inferNodeType(source);
    } else if (
      source.name != null &&
      source.flags != null &&
      source.valueDeclaration != null &&
      source.declarations != null
    ) {
      //ts.Symbol
      source = this.variables[source.valueDeclaration.pos].type;
    }

    if (source instanceof ArrayType) {
      this.ensureArrayStruct(source.elementType);
      return source.getText();
    } else if (source instanceof StructType) {
      return source.getText();
    } else if (source instanceof DictType) {
      return source.getText();
    } else if (typeof source === "string") {
      return source;
    } else {
      throw new Error("Unrecognized type source");
    }
  }

  /** Convert ts.Type to NativeType */
  /** Used mostly during type preprocessing stage */
  public convertType(tsType: ts.Type, ident?: ts.Identifier): NativeType {
    if (!tsType || tsType.flags === ts.TypeFlags.Void) {
      return "void";
    } else if (
      tsType.flags === ts.TypeFlags.String ||
      tsType.flags === ts.TypeFlags.StringLiteral
    ) {
      return StringType;
    } else if (
      tsType.flags === ts.TypeFlags.Number ||
      tsType.flags === ts.TypeFlags.NumberLiteral
    ) {
      if (ident && ident.parent.kind === ts.SyntaxKind.PropertyAssignment) {
        return this.inferNodeType(ident.parent);
      }
      return IntegerType;
    } else if (
      tsType.flags === ts.TypeFlags.Boolean ||
      tsType.flags === ts.TypeFlags.Boolean + ts.TypeFlags.Union
    ) {
      return BooleanType;
    } else if (
      tsType.flags & ts.TypeFlags.Object &&
      tsType.getProperties().length > 0
    ) {
      return this.structures.generateStructure(tsType, ident);
    } else if (tsType.flags === ts.TypeFlags.Any) {
      return PointerType;
    }

    log("Non-standard type: " + this.typeChecker.typeToString(tsType));

    return PointerType;
  }

  private functionPrototypes: {
    [funcDeclPos: number]: ts.FunctionDeclaration;
  } = {};

  public getFunctionPrototypes() {
    return Object.keys(this.functionPrototypes).map(
      k => this.functionPrototypes[k]
    );
  }

  public getDeclaredStructs() {
    return this.structures.getDeclaredStructs();
  }

  private visitCallExpression(node: ts.CallExpression) {
    if (node.expression.kind === ts.SyntaxKind.Identifier) {
      const funcSymbol = this.typeChecker.getSymbolAtLocation(node.expression);
      if (funcSymbol != null) {
        const funcDeclPos = funcSymbol.valueDeclaration.pos + 1;
        if (funcDeclPos > node.pos) {
          this.functionPrototypes[
            funcDeclPos
          ] = funcSymbol.valueDeclaration as ts.FunctionDeclaration;
        }
        for (let i = 0; i < node.arguments.length; i++) {
          if (!this.functionCallsData[funcDeclPos]) {
            this.functionCallsData[funcDeclPos] = [];
          }
          const callData = this.functionCallsData[funcDeclPos];
          const argId = node.arguments[i].pos + "_" + node.arguments[i].end;
          if (!callData[i]) { callData[i] = {}; }
          callData[i][argId] = new TypePromise(node.arguments[i]);
        }
      }
    }
  }

  private visitReturnStatement(node: ts.ReturnStatement) {
    const parentFunc = ScopeUtil.findParentFunction(node);
    const funcPos = parentFunc && parentFunc.pos;
    if (funcPos != null) {
      if (node.expression) {
        if (node.expression.kind === ts.SyntaxKind.ObjectLiteralExpression) {
          this.addTypePromise(funcPos, node.expression);
          const objLiteral = node.expression as ts.ObjectLiteralExpression;
          for (const propAssignment of objLiteral.properties
            .filter(p => p.kind === ts.SyntaxKind.PropertyAssignment)
            .map(p => p as ts.PropertyAssignment)) {
            this.addTypePromise(
              funcPos,
              propAssignment.initializer,
              TypePromiseKind.propertyType,
              propAssignment.name.getText()
            );
          }
        } else { this.addTypePromise(funcPos, node.expression); }
      } else {
        this.addTypePromise(funcPos, node, TypePromiseKind.void);
      }
    }
  }

  private visitArrayLiteralExpression(node: ts.ArrayLiteralExpression) {
    if (!this.arrayLiteralsTypes[node.pos]) {
      this.determineArrayType(node as ts.ArrayLiteralExpression);
    }

    const arrType = this.arrayLiteralsTypes[node.pos];
    if (
      arrType instanceof ArrayType &&
      node.parent.kind === ts.SyntaxKind.PropertyAccessExpression &&
      node.parent.parent.kind === ts.SyntaxKind.CallExpression
    ) {
      const propAccess = node.parent as ts.PropertyAccessExpression;
      // if array literal is concatenated, we need to ensure that we
      // have corresponding dynamic array type for the temporary variable
      if (propAccess.name.getText() === "concat") {
        this.ensureArrayStruct(arrType.elementType);
      }
    }
  }

  private visitObjectLiteralExpression(node: ts.ObjectLiteralExpression) {
    if (!this.objectLiteralsTypes[node.pos]) {
      const type = this.structures.generateStructure(
        this.typeChecker.getTypeAtLocation(node)
      );
      this.objectLiteralsTypes[node.pos] = type;
    }
  }

  private visitIdentifier(node: ts.Identifier) {
    let varPos = null;
    let varInfo = null;
    let varData = null;
    let varNode = null;

    const symbol = this.typeChecker.getSymbolAtLocation(node);
    if (symbol) {
      if (
        symbol.declarations &&
        symbol.declarations.length === 0 &&
        symbol.name !== "arguments"
      ) {
        throw new Error("Undeclared variable");
      } else {
        varPos = symbol.valueDeclaration.pos;
        if (!this.variables[varPos]) {
          this.variables[varPos] = new VariableInfo();
          this.variablesData[varPos] = new VariableData();
          this.variables[varPos].name = node.getText();
          this.variables[varPos].declaration = symbol.declarations[0].name;
        }
        varInfo = this.variables[varPos];
        varData = this.variablesData[varPos];
        varInfo.references.push(node);
        varNode = node;
      }
    }
    this.createPromisesForVariableData(varData, varNode, varPos);
  }

  private visitPropertyAccessExpression(node: ts.PropertyAccessExpression) {
    let varPos = null;
    let varInfo = null;
    let varData = null;
    let varNode = null;

    const propAccess = node as ts.PropertyAccessExpression;
    const propName = propAccess.name.getText();
    // drill down to identifier
    let topPropAccess = propAccess;
    const propsChain: ts.Identifier[] = [];
    while (
      topPropAccess.expression.kind === ts.SyntaxKind.PropertyAccessExpression
    ) {
      topPropAccess = topPropAccess.expression as ts.PropertyAccessExpression;
      propsChain.push(topPropAccess.name);
    }
    if (topPropAccess.expression.kind === ts.SyntaxKind.Identifier) {
      const topSymbol = this.typeChecker.getSymbolAtLocation(
        topPropAccess.expression
      );
      if (topSymbol) {
        // go from identifier to property
        varPos = topSymbol.valueDeclaration.pos;
        let varName = topSymbol.name;
        while (propsChain.length) {
          const propIdent = propsChain.pop();
          varName += "." + propIdent.getText();
          let nextVarPos = this.variablesData[varPos].varDeclPosByPropName[
            propIdent.getText()
          ];
          if (nextVarPos === null) {
            nextVarPos = propIdent.pos;
            // create new variable that represents this property
            this.variablesData[varPos].varDeclPosByPropName[
              propIdent.getText()
            ] =
              propIdent.pos;
            this.variables[nextVarPos] = new VariableInfo();
            this.variablesData[nextVarPos] = new VariableData();
            this.variables[nextVarPos].name = varName;
            this.variables[nextVarPos].declaration = propAccess.expression;
          }
          varPos = nextVarPos;
        }
        varInfo = this.variables[varPos];
        // TODO - handle variables outside program
        // like console
        if (varInfo) {
          varData = this.variablesData[varPos];
          varInfo.references.push(propAccess.expression);
          varNode = propAccess.expression;
        }
      }
    }
    this.createPromisesForVariableData(varData, varNode, varPos);
  }

  private visitNode(node: ts.Node) {
    if (PluginRegistry.matchesNode(node)) {
      PluginRegistry.processTypesForNode(node);
    } else if (node.kind === ts.SyntaxKind.CallExpression) {
      this.visitCallExpression(node as ts.CallExpression);
    } else if (node.kind === ts.SyntaxKind.ReturnStatement) {
      this.visitReturnStatement(node as ts.ReturnStatement);
    } else if (node.kind === ts.SyntaxKind.ArrayLiteralExpression) {
      this.visitArrayLiteralExpression(node as ts.ArrayLiteralExpression);
    } else if (node.kind === ts.SyntaxKind.ObjectLiteralExpression) {
      this.visitObjectLiteralExpression(node as ts.ObjectLiteralExpression);
    } else if (
      node.kind === ts.SyntaxKind.Identifier ||
      node.kind === ts.SyntaxKind.PropertyAccessExpression
    ) {
      if (node.kind === ts.SyntaxKind.PropertyAccessExpression) {
        this.visitPropertyAccessExpression(node as ts.PropertyAccessExpression);
      } else if (node.kind === ts.SyntaxKind.Identifier) {
        this.visitIdentifier(node as ts.Identifier);
      }
    }

    node.getChildren().forEach(c => this.visitNode(c));
  }

  private createVariableDeclarationPromise(varData, varNode, varPos) {
    const varDecl = varNode.parent as ts.VariableDeclaration;
    if (varDecl.name.getText() === varNode.getText()) {
      this.addTypePromise(varPos, varDecl.initializer);
      if (
        varDecl.initializer &&
        varDecl.initializer.kind === ts.SyntaxKind.ObjectLiteralExpression
      ) {
        varData.wasObjectLiteralAssigned = true;
        const objLiteral = varDecl.initializer as ts.ObjectLiteralExpression;
        for (const propAssignment of objLiteral.properties
          .filter(p => p.kind === ts.SyntaxKind.PropertyAssignment)
          .map(p => p as ts.PropertyAssignment)) {
          this.addTypePromise(
            varPos,
            propAssignment.initializer,
            TypePromiseKind.propertyType,
            propAssignment.name.getText()
          );
        }
      }
      if (
        varDecl.initializer &&
        varDecl.initializer.kind === ts.SyntaxKind.ArrayLiteralExpression
      ) {
        varData.arrLiteralAssigned = true;
      }
      if (
        varDecl.parent &&
        varDecl.parent.parent &&
        varDecl.parent.parent.kind === ts.SyntaxKind.ForOfStatement
      ) {
        const forOfStatement = varDecl.parent.parent as ts.ForOfStatement;
        if (
          forOfStatement.initializer.kind ==
          ts.SyntaxKind.VariableDeclarationList
        ) {
          const forOfInitializer = forOfStatement.initializer as ts.VariableDeclarationList;
          if (forOfInitializer.declarations[0].pos === varDecl.pos) {
            this.addTypePromise(
              varPos,
              forOfStatement.expression,
              TypePromiseKind.forOfIterator
            );
          }
        }
      } else if (
        varDecl.parent &&
        varDecl.parent.parent &&
        varDecl.parent.parent.kind === ts.SyntaxKind.ForInStatement
      ) {
        const forInStatement = varDecl.parent.parent as ts.ForInStatement;
        if (
          forInStatement.initializer.kind ==
          ts.SyntaxKind.VariableDeclarationList
        ) {
          const forInInitializer = forInStatement.initializer as ts.VariableDeclarationList;
          if (forInInitializer.declarations[0].pos === varDecl.pos) {
            this.addTypePromise(
              varPos,
              forInStatement.expression,
              TypePromiseKind.forInIterator
            );
          }
        }
      }
    }
  }

  private createParameterPromise(varData, varNode, varPos) {
    const funcDecl = varNode.parent.parent as ts.FunctionDeclaration;
    for (let i = 0; i < funcDecl.parameters.length; i++) {
      if (funcDecl.parameters[i].pos === varNode.pos) {
        const param = funcDecl.parameters[i];
        varData.parameterIndex = i;
        varData.parameterFuncDeclPos = funcDecl.pos + 1;
        this.addTypePromise(varPos, param.name);
        this.addTypePromise(varPos, param.initializer);
        break;
      }
    }
  }

  private createFunctionDeclarationPromise(varData, varNode, varPos) {
    this.addTypePromise(varPos, varNode.parent, TypePromiseKind.void);
  }

  private createBinaryExpressionPromise(varData, varNode, varPos) {
    const binExpr = varNode.parent as ts.BinaryExpression;
    if (
      binExpr.left.kind === ts.SyntaxKind.Identifier &&
      binExpr.left.getText() === varNode.getText() &&
      binExpr.operatorToken.kind === ts.SyntaxKind.EqualsToken
    ) {
      this.addTypePromise(varPos, binExpr.left);
      this.addTypePromise(varPos, binExpr.right);
      if (
        binExpr.right &&
        binExpr.right.kind === ts.SyntaxKind.ObjectLiteralExpression
      ) {
        varData.wasObjectLiteralAssigned = true;
        const objLiteral = binExpr.right as ts.ObjectLiteralExpression;
        for (const propAssignment of objLiteral.properties
          .filter(p => p.kind === ts.SyntaxKind.PropertyAssignment)
          .map(p => p as ts.PropertyAssignment)) {
          this.addTypePromise(
            varPos,
            propAssignment.initializer,
            TypePromiseKind.propertyType,
            propAssignment.name.getText()
          );
        }
      }
      if (
        binExpr.right &&
        binExpr.right.kind === ts.SyntaxKind.ArrayLiteralExpression
      ) {
        varData.arrLiteralAssigned = true;
      }
    }
  }

  private createPropertyAccessExpressionPromise(varData, varNode, varPos) {
    const propAccess = varNode.parent as ts.PropertyAccessExpression;
    const propName = propAccess.name.getText();
    if (
      propAccess.expression.pos === varNode.pos &&
      propAccess.parent.kind === ts.SyntaxKind.BinaryExpression
    ) {
      const binExpr = propAccess.parent as ts.BinaryExpression;
      if (
        binExpr.left.pos === propAccess.pos &&
        binExpr.operatorToken.kind === ts.SyntaxKind.EqualsToken
      ) {
        this.addTypePromise(
          varPos,
          binExpr.left,
          TypePromiseKind.propertyType,
          propAccess.name.getText()
        );
        this.addTypePromise(
          varPos,
          binExpr.right,
          TypePromiseKind.propertyType,
          propAccess.name.getText()
        );
      }
    }
    if (propName === "push" || propName === "unshift") {
      varData.isDynamicArray = true;
      if (
        propAccess.parent &&
        propAccess.parent.kind === ts.SyntaxKind.CallExpression
      ) {
        const call = propAccess.parent as ts.CallExpression;
        for (const arg of call.arguments) {
          this.addTypePromise(varPos, arg, TypePromiseKind.dynamicArrayOf);
        }
      }
    }
    if (propName === "pop" || propName === "shift") {
      varData.isDynamicArray = true;
      if (
        propAccess.parent &&
        propAccess.parent.kind === ts.SyntaxKind.CallExpression
      ) {
        const call = propAccess.parent as ts.CallExpression;
        if (call.arguments.length === 0) {
          this.addTypePromise(varPos, call, TypePromiseKind.dynamicArrayOf);
        }
      }
    }
    if (
      propAccess.expression.kind === ts.SyntaxKind.Identifier &&
      propName === "sort"
    ) {
      varData.isDynamicArray = true;
    }
    if (
      propAccess.expression.kind === ts.SyntaxKind.Identifier &&
      propName === "reverse"
    ) {
      varData.isDynamicArray = true;
    }
    if (
      propAccess.expression.kind === ts.SyntaxKind.Identifier &&
      propName === "splice"
    ) {
      varData.isDynamicArray = true;
      if (
        propAccess.parent &&
        propAccess.parent.kind === ts.SyntaxKind.CallExpression
      ) {
        const call = propAccess.parent as ts.CallExpression;
        if (call.arguments.length > 2) {
          for (const arg of call.arguments.slice(2)) {
            this.addTypePromise(varPos, arg, TypePromiseKind.dynamicArrayOf);
          }
        }
        if (call.arguments.length >= 2) {
          this.addTypePromise(varPos, call);
        }
      }
    }
    if (
      propAccess.expression.kind === ts.SyntaxKind.Identifier &&
      propName === "slice"
    ) {
      varData.isDynamicArray = true;
      if (
        propAccess.parent &&
        propAccess.parent.kind === ts.SyntaxKind.CallExpression
      ) {
        const call = propAccess.parent as ts.CallExpression;
        if (call.arguments.length >= 1) {
          this.addTypePromise(varPos, call);
        }
      }
    }
  }

  private createElementAccessExpressionPromise(varData, varNode, varPos) {
    const elemAccess = varNode.parent as ts.ElementAccessExpression;
    if (elemAccess.expression.pos === varNode.pos) {
      let propName;
      let promiseKind;
      if (elemAccess.argumentExpression.kind === ts.SyntaxKind.StringLiteral) {
        propName = elemAccess.argumentExpression.getText().slice(1, -1);
        promiseKind = TypePromiseKind.propertyType;
      } else if (
        elemAccess.argumentExpression.kind === ts.SyntaxKind.NumericLiteral
      ) {
        promiseKind = TypePromiseKind.arrayOf;
      } else {
        varData.isDict = true;
        promiseKind = TypePromiseKind.dictOf;
      }

      this.addTypePromise(varPos, elemAccess, promiseKind, propName);

      if (
        elemAccess.parent &&
        elemAccess.parent.kind === ts.SyntaxKind.BinaryExpression
      ) {
        const binExpr = elemAccess.parent as ts.BinaryExpression;
        if (
          binExpr.left.pos === elemAccess.pos &&
          binExpr.operatorToken.kind === ts.SyntaxKind.EqualsToken
        ) {
          if (promiseKind === TypePromiseKind.dictOf) {
            this.addTypePromise(varPos, binExpr.right, promiseKind);
          } else if (
            elemAccess.argumentExpression.kind === ts.SyntaxKind.StringLiteral
          ) {
            this.addTypePromise(varPos, binExpr.right, promiseKind, propName);
          }
        }
      }
    }
  }

  private createForOfStatementPromise(varData, varNode, varPos) {
    const forOfStatement = varNode.parent as ts.ForOfStatement;
    if (
      forOfStatement.initializer.kind === ts.SyntaxKind.Identifier &&
      forOfStatement.initializer.pos === varNode.pos
    ) {
      this.addTypePromise(
        varPos,
        forOfStatement.expression,
        TypePromiseKind.forOfIterator
      );
    }
  }

  private createForInStatementPromise(varData, varNode, varPos) {
    const forInStatement = varNode.parent as ts.ForInStatement;
    if (
      forInStatement.initializer.kind === ts.SyntaxKind.Identifier &&
      forInStatement.initializer.pos === varNode.pos
    ) {
      this.addTypePromise(
        varPos,
        forInStatement.expression,
        TypePromiseKind.forInIterator
      );
    }
  }

  private createPromisesForVariableData(varData, varNode, varPos) {
    if (varData) {
      if (
        varNode.parent &&
        varNode.parent.kind === ts.SyntaxKind.VariableDeclaration
      ) {
        this.createVariableDeclarationPromise(varData, varNode, varPos);
      } else if (
        varNode.parent &&
        varNode.parent.kind === ts.SyntaxKind.FunctionDeclaration
      ) {
        this.createFunctionDeclarationPromise(varData, varNode, varPos);
      } else if (
        varNode.parent &&
        varNode.parent.kind === ts.SyntaxKind.Parameter
      ) {
        this.createParameterPromise(varData, varNode, varPos);
      } else if (
        varNode.parent &&
        varNode.parent.kind === ts.SyntaxKind.BinaryExpression
      ) {
        this.createBinaryExpressionPromise(varData, varNode, varPos);
      } else if (
        varNode.parent &&
        varNode.parent.kind === ts.SyntaxKind.PropertyAccessExpression
      ) {
        this.createPropertyAccessExpressionPromise(varData, varNode, varPos);
      } else if (
        varNode.parent &&
        varNode.parent.kind === ts.SyntaxKind.ElementAccessExpression
      ) {
        this.createElementAccessExpressionPromise(varData, varNode, varPos);
      } else if (
        varNode.parent &&
        varNode.parent.kind === ts.SyntaxKind.ForOfStatement
      ) {
        this.createForOfStatementPromise(varData, varNode, varPos);
      } else if (
        varNode.parent &&
        varNode.parent.kind === ts.SyntaxKind.ForInStatement
      ) {
        this.createForInStatementPromise(varData, varNode, varPos);
      }
    }
  }

  private resolvePromisesAndFinalizeTypes() {
    let somePromisesAreResolved: boolean;

    do {
      somePromisesAreResolved = this.tryResolvePromises();

      for (const k of Object.keys(this.variables).map(k => +k)) {
        const promises = Object.keys(this.variablesData[k].typePromises).map(
          p => this.variablesData[k].typePromises[p]
        );
        const variableBestTypes = promises
          .filter(p => p.promiseKind != TypePromiseKind.propertyType)
          .map(p => p.bestType);

        if (this.variables[k].type) {
          variableBestTypes.push(this.variables[k].type);
        }

        let varType = variableBestTypes.length
          ? variableBestTypes.reduce((c, n) => this.mergeTypes(c, n).type)
          : null;
        varType = varType || PointerType;

        if (varType instanceof ArrayType) {
          if (
            this.variablesData[k].isDynamicArray &&
            !this.variablesData[k].parameterFuncDeclPos &&
            this.variablesData[k].arrLiteralAssigned
          ) {
            this.variables[k].requiresAllocation = true;
          }
          varType.isDynamicArray =
            varType.isDynamicArray || this.variablesData[k].isDynamicArray;
        } else if (varType instanceof StructType) {
          if (this.variablesData[k].wasObjectLiteralAssigned) {
            this.variables[k].requiresAllocation = true;
          }
          const keys1 = Object.keys(this.variablesData[k].addedProperties);
          const keys2 = Object.keys(this.variablesData[k].varDeclPosByPropName);
          const allPropKeys = keys1.concat(keys2);
          for (const propKey of allPropKeys) {
            const propVarPos = this.variablesData[k].varDeclPosByPropName[
              propKey
            ];
            const type1 = propVarPos && this.variables[propVarPos].type;
            const type2 = this.variablesData[k].addedProperties[propKey];
            varType.properties[propKey] = this.mergeTypes(type1, type2).type;
          }
        } else if (varType instanceof DictType) {
          if (!this.variablesData[k].parameterFuncDeclPos) {
            this.variables[k].requiresAllocation = true;
          }
          let elemType = varType.elementType;
          const keys1 = Object.keys(this.variablesData[k].addedProperties);
          const keys2 = Object.keys(this.variablesData[k].varDeclPosByPropName);
          const allPropKeys = keys1.concat(keys2);
          for (const propKey of allPropKeys) {
            const propVarPos = this.variablesData[k].varDeclPosByPropName[
              propKey
            ];
            const type1 = propVarPos && this.variables[propVarPos].type;
            const type2 = this.variablesData[k].addedProperties[propKey];
            elemType = this.mergeTypes(elemType, type1).type;
            elemType = this.mergeTypes(elemType, type2).type;
          }

          varType.elementType = elemType;
        }
        this.variables[k].type = varType;
      }
    } while (somePromisesAreResolved);

    for (const k of Object.keys(this.variables).map(k => +k)) {
      const varInfo = this.variables[k];
      for (const ref of varInfo.references) {
        if (ref.parent.kind === ts.SyntaxKind.BinaryExpression) {
          const binaryExpression = ref.parent as ts.BinaryExpression;
          if (
            binaryExpression.operatorToken.kind === ts.SyntaxKind.SlashToken
          ) {
            varInfo.type = FloatType;
          }
        }
        if (ref.parent.kind === ts.SyntaxKind.PropertyAssignment) {
          const propAssignment = ref.parent as ts.PropertyAssignment;
          if (
            propAssignment.initializer &&
            propAssignment.initializer.kind ==
              ts.SyntaxKind.ArrayLiteralExpression
          ) {
            const type = this.inferNodeType(ref.parent.parent);
            if (type && type instanceof StructType) {
              this.arrayLiteralsTypes[propAssignment.initializer.pos] =
                type.properties[varInfo.name];
            }
          }
        }
      }
    }
  }

  private tryResolvePromises() {
    let somePromisesAreResolved = false;

    /** Function parameters */
    for (const varPos of Object.keys(this.variables).map(k => +k)) {
      const funcDeclPos = this.variablesData[varPos].parameterFuncDeclPos;
      if (funcDeclPos && this.functionCallsData[funcDeclPos]) {
        const paramIndex = this.variablesData[varPos].parameterIndex;
        const functionCallsPromises = this.functionCallsData[funcDeclPos][
          paramIndex
        ];
        const variablePromises = this.variablesData[varPos].typePromises;
        for (const id in functionCallsPromises) {
          if (!variablePromises[id]) {
            variablePromises[id] = functionCallsPromises[id];
            somePromisesAreResolved = true;
          }
          const currentType = variablePromises[id].bestType || PointerType;
          const resolvedType = this.inferNodeType(
            functionCallsPromises[id].associatedNode
          );
          const mergeResult = this.mergeTypes(currentType, resolvedType);
          if (mergeResult.replaced) { somePromisesAreResolved = true; }
          variablePromises[id].bestType = mergeResult.type;
        }
      }
    }

    /** Variables */
    for (const varPos of Object.keys(this.variables).map(k => +k)) {
      for (const promiseId in this.variablesData[varPos].typePromises) {
        const promise = this.variablesData[varPos].typePromises[promiseId];
        const resolvedType =
          this.inferNodeType(promise.associatedNode) || PointerType;

        let finalType = resolvedType;
        if (promise.promiseKind === TypePromiseKind.dynamicArrayOf) {
          // nested arrays should also be dynamic
          if (resolvedType instanceof ArrayType) {
            resolvedType.isDynamicArray = true;
          }
          finalType = new ArrayType(resolvedType, 0, true);
        } else if (promise.promiseKind === TypePromiseKind.arrayOf) {
          finalType = new ArrayType(resolvedType, 0, false);
        } else if (promise.promiseKind === TypePromiseKind.dictOf) {
          finalType = new DictType(resolvedType);
        } else if (
          resolvedType instanceof ArrayType &&
          promise.promiseKind === TypePromiseKind.forOfIterator
        ) {
          finalType = resolvedType.elementType;
        } else if (
          resolvedType instanceof DictType &&
          promise.promiseKind === TypePromiseKind.forInIterator
        ) {
          finalType = StringType;
        } else if (promise.promiseKind === TypePromiseKind.void) {
          finalType = "void";
        }

        let bestType = promise.bestType;
        if (promise.promiseKind === TypePromiseKind.propertyType) {
          const propVarPos = this.variablesData[varPos].varDeclPosByPropName[
            promise.propertyName
          ];
          if (propVarPos) { bestType = this.variables[propVarPos].type; } else {
            bestType = this.variablesData[varPos].addedProperties[
              promise.propertyName
            ];
          }
        }

        const mergeResult = this.mergeTypes(bestType, finalType);
        if (mergeResult.replaced) {
          somePromisesAreResolved = true;
          this.variablesData[varPos].typeResolutionLog.push({
            prop: promise.propertyName,
            result: mergeResult.type,
            finalType,
            promise
          });
        }
        promise.bestType = mergeResult.type;

        if (
          promise.promiseKind === TypePromiseKind.propertyType &&
          mergeResult.replaced
        ) {
          const propVarPos = this.variablesData[varPos].varDeclPosByPropName[
            promise.propertyName
          ];
          if (propVarPos) { this.variables[propVarPos].type = mergeResult.type; } else {
            this.variablesData[varPos].addedProperties[promise.propertyName] =
              mergeResult.type;
          }
        }
      }
    }

    return somePromisesAreResolved;
  }

  public determineArrayType(arrLiteral: ts.ArrayLiteralExpression): ArrayType {
    let elementType: NativeType = PointerType;
    const cap = arrLiteral.elements.length;
    if (cap > 0) {
      if (
        arrLiteral.elements[0].kind === ts.SyntaxKind.ArrayLiteralExpression
      ) {
        elementType = this.determineArrayType(
          arrLiteral.elements[0] as ts.ArrayLiteralExpression
        );
      } else {
        elementType = this.inferNodeType(arrLiteral.elements[0]);
        if (!elementType) {
          elementType = this.convertType(
            this.typeChecker.getTypeAtLocation(arrLiteral.elements[0])
          );
        }
      }
    }

    const type = new ArrayType(elementType, cap, false);
    this.arrayLiteralsTypes[arrLiteral.pos] = type;
    return type;
  }

  public getArrayLiteralType(pos: number) {
    return this.arrayLiteralsTypes[pos];
  }

  public getObjectLiteralType(pos: number) {
    return this.objectLiteralsTypes[pos];
  }

  public getVariableType(pos: number) {
    const varInfo = this.variables[pos];
    return varInfo && varInfo.type;
  }

  private addTypePromise(
    varPos: number,
    associatedNode: ts.Node,
    promiseKind: TypePromiseKind = TypePromiseKind.variable,
    propName: string = null
  ) {
    if (!associatedNode) { return; }
    if (associatedNode.kind === ts.SyntaxKind.ConditionalExpression) {
      const ternary = associatedNode as ts.ConditionalExpression;
      this.addTypePromise(varPos, ternary.whenTrue, promiseKind, propName);
      this.addTypePromise(varPos, ternary.whenFalse, promiseKind, propName);
      return;
    }

    const promiseId = associatedNode.pos + "_" + associatedNode.end;
    const promise = new TypePromise(associatedNode, promiseKind, propName);
    this.variablesData[varPos].typePromises[promiseId] = promise;
  }

  private mergeTypes(currentType: NativeType, newType: NativeType) {
    const newResult = { type: newType, replaced: true };
    const currentResult = { type: currentType, replaced: false };

    if (!currentType && newType) { return newResult; } else if (!newType) { return currentResult; } else if (this.getTypeString(currentType) === this.getTypeString(newType)) {
      return currentResult;
         } else if (currentType === "void") { return newResult; } else if (newType === "void") { return currentResult; } else if (currentType === PointerType) { return newResult; } else if (newType === PointerType) { return currentResult; } else if (currentType === UniversalType) { return newResult; } else if (newType === UniversalType) { return currentResult; } else if (currentType === IntegerType && newType === FloatType) {
      return newResult;
         } else if (currentType === FloatType && newType === IntegerType) {
      return currentResult;
         } else if (currentType instanceof ArrayType && newType instanceof ArrayType) {
      const cap = Math.max(newType.capacity, currentType.capacity);
      newType.capacity = cap;
      currentType.capacity = cap;
      const isDynamicArray = newType.isDynamicArray || currentType.isDynamicArray;
      newType.isDynamicArray = isDynamicArray;
      currentType.isDynamicArray = isDynamicArray;

      const mergeResult = this.mergeTypes(
        currentType.elementType,
        newType.elementType
      );
      newType.elementType = mergeResult.type;
      currentType.elementType = mergeResult.type;
      if (mergeResult.replaced) { return newResult; }

      return currentResult;
    } else if (
      currentType instanceof DictType &&
      newType instanceof ArrayType
    ) {
      if (
        newType.elementType === currentType.elementType ||
        currentType.elementType === PointerType
      ) {
        return newResult;
      }
    } else if (
      currentType instanceof ArrayType &&
      newType instanceof DictType
    ) {
      if (
        newType.elementType === currentType.elementType ||
        newType.elementType === PointerType
      ) {
        return currentResult;
      }
    } else if (
      currentType instanceof StructType &&
      newType instanceof DictType
    ) {
      return newResult;
    } else if (currentType instanceof DictType && newType instanceof DictType) {
      if (
        newType.elementType != PointerType &&
        currentType.elementType === PointerType
      ) {
        return newResult;
      }

      return currentResult;
    }

    log(
      "WARNING: candidate for UniversalType! Current: " +
        this.getTypeString(currentType) +
        ", new: " +
        this.getTypeString(newType)
    );
    return currentResult;
  }
}
