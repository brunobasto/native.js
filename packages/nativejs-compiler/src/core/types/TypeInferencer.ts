import * as ts from "typescript";
import debug from "debug";
import { StandardCallHelper } from "../resolver";
import {
  ArrayType,
  BooleanType,
  DictType,
  FloatType,
  IntegerType,
  LongType,
  NativeType,
  PointerType,
  RegexType,
  SignedType,
  StringType,
  StructType,
  UniversalType
} from "./NativeTypes";
import { ScopeUtil } from "../scope/ScopeUtil";
import { TypeRegistry } from "./TypeRegistry";
import { TypeVisitor } from "./TypeVisitor";
import { CProgram } from "../program";

const log = debug("TypeInferencer");

export class TypeInferencer {
  private typeChecker: ts.TypeChecker;

  constructor(private program: CProgram) {
    this.typeChecker = program.typeChecker;
  }

  private getTypeVisitor() {
    return this.program.typeVisitor;
  }

  public isFloatExpression(binaryExpression: ts.BinaryExpression): boolean {
    // bitwise operators are excluded from this
    if (ScopeUtil.isChildOfBitwiseOperation(binaryExpression)) {
      return false;
    }
    // if expression is a division
    if (binaryExpression.operatorToken.kind === ts.SyntaxKind.SlashToken) {
      log(`Expression ${binaryExpression.getText()} evaluates to float`);
      return true;
    }
    // if left or right is float identifier
    if (
      binaryExpression.left.kind === ts.SyntaxKind.Identifier &&
      this.getTypeVisitor().getVariableInfo(
        <ts.Identifier>binaryExpression.left
      ).type === FloatType
    ) {
      return true;
    }
    if (
      binaryExpression.left.kind === ts.SyntaxKind.Identifier &&
      this.getTypeVisitor().getVariableInfo(
        <ts.Identifier>binaryExpression.left
      ).type === FloatType
    ) {
      return true;
    }
    // check for each binary expression inside the given expression
    if (
      binaryExpression.right.kind === ts.SyntaxKind.BinaryExpression &&
      this.isFloatExpression(<ts.BinaryExpression>binaryExpression.right)
    ) {
      return true;
    }
    if (
      binaryExpression.left.kind === ts.SyntaxKind.BinaryExpression &&
      this.isFloatExpression(<ts.BinaryExpression>binaryExpression.left)
    ) {
      return true;
    }
    // check if parenthesized expression
    if (binaryExpression.left.kind === ts.SyntaxKind.ParenthesizedExpression) {
      const parenthesizedExpression = <ts.ParenthesizedExpression>binaryExpression.left;
      if (
        parenthesizedExpression.expression.kind ==
          ts.SyntaxKind.BinaryExpression &&
        this.isFloatExpression(
          <ts.BinaryExpression>parenthesizedExpression.expression
        )
      ) {
        return true;
      }
    }
    if (binaryExpression.right.kind === ts.SyntaxKind.ParenthesizedExpression) {
      const parenthesizedExpression = <ts.ParenthesizedExpression>binaryExpression.right;
      if (
        parenthesizedExpression.expression.kind ==
          ts.SyntaxKind.BinaryExpression &&
        this.isFloatExpression(
          <ts.BinaryExpression>parenthesizedExpression.expression
        )
      ) {
        return true;
      }
    }
    if (
      binaryExpression.left.kind === ts.SyntaxKind.NumericLiteral &&
      this.isFloatLiteral(<ts.NumericLiteral>binaryExpression.left)
    ) {
      return true;
    }
    if (
      binaryExpression.right.kind === ts.SyntaxKind.NumericLiteral &&
      this.isFloatLiteral(<ts.NumericLiteral>binaryExpression.right)
    ) {
      return true;
    }
    return false;
  }

  public isLongExpression(binaryExpression: ts.BinaryExpression) {
    // bitwise operators are excluded from this
    if (ScopeUtil.isChildOfBitwiseOperation(binaryExpression)) {
      return false;
    }
    // if left or right is float identifier
    if (
      binaryExpression.left.kind === ts.SyntaxKind.Identifier &&
      this.getTypeVisitor().getVariableInfo(
        <ts.Identifier>binaryExpression.left
      ).type === LongType
    ) {
      return true;
    }
    if (
      binaryExpression.left.kind === ts.SyntaxKind.Identifier &&
      this.getTypeVisitor().getVariableInfo(
        <ts.Identifier>binaryExpression.left
      ).type === LongType
    ) {
      return true;
    }
    // check for each binary expression inside the given expression
    if (
      binaryExpression.right.kind === ts.SyntaxKind.BinaryExpression &&
      this.isLongExpression(<ts.BinaryExpression>binaryExpression.right)
    ) {
      return true;
    }
    if (
      binaryExpression.left.kind === ts.SyntaxKind.BinaryExpression &&
      this.isLongExpression(<ts.BinaryExpression>binaryExpression.left)
    ) {
      return true;
    }
    // check if parenthesized expression
    if (binaryExpression.left.kind === ts.SyntaxKind.ParenthesizedExpression) {
      const parenthesizedExpression = <ts.ParenthesizedExpression>binaryExpression.left;
      if (
        parenthesizedExpression.expression.kind ==
          ts.SyntaxKind.BinaryExpression &&
        this.isLongExpression(
          <ts.BinaryExpression>parenthesizedExpression.expression
        )
      ) {
        return true;
      }
    }
    if (binaryExpression.right.kind === ts.SyntaxKind.ParenthesizedExpression) {
      const parenthesizedExpression = <ts.ParenthesizedExpression>binaryExpression.right;
      if (
        parenthesizedExpression.expression.kind ==
          ts.SyntaxKind.BinaryExpression &&
        this.isLongExpression(
          <ts.BinaryExpression>parenthesizedExpression.expression
        )
      ) {
        return true;
      }
    }
    return false;
  }

  public isFloatLiteral(node: ts.NumericLiteral): boolean {
    // if it contains a floating point, return true
    const literalText = node.getText();
    if (literalText.indexOf(".") > -1) {
      return true;
    }
    // if it's a variable declaration
    let parent = ScopeUtil.findParentWithKind(
      node,
      ts.SyntaxKind.VariableDeclaration
    );
    if (parent) {
      const declaration = <ts.VariableDeclaration>parent;
      let varInfo = this.getTypeVisitor().getVariableInfo(declaration.name);
      for (let ref of varInfo.references) {
        // and one of its references is a binary expression
        const binary = ScopeUtil.findParentWithKind(
          ref,
          ts.SyntaxKind.BinaryExpression
        );
        if (binary) {
          if (this.isFloatExpression(<ts.BinaryExpression>binary)) {
            log(`so [${declaration.name.getText()}] evaluates to float`);
            return true;
          }
        }
      }
    }

    return false;
  }

  private inferNumericLiteral(node: ts.NumericLiteral) {
    // if it's. a float, return float
    if (this.isFloatLiteral(node)) {
      return FloatType;
    }
    // if it's a big number, return long
    const literalText = node.getText();
    if (literalText.indexOf("-") === 0) {
      return SignedType;
    }
    if (parseInt(literalText, 10) > 1023) {
      return LongType;
    }
    // else return int
    return IntegerType;
  }

  private inferBinaryExpression(node: ts.BinaryExpression) {
    const parentBinary = ScopeUtil.findParentWithKind(
      node,
      ts.SyntaxKind.BinaryExpression
    );
    log(
      parentBinary.getText(),
      this.isFloatExpression(<ts.BinaryExpression>parentBinary)
    );
    if (this.isFloatExpression(<ts.BinaryExpression>parentBinary)) {
      return FloatType;
    } else if (this.isLongExpression(<ts.BinaryExpression>parentBinary)) {
      return LongType;
    } else {
      let tsType = this.typeChecker.getTypeAtLocation(node);
      let type = tsType && this.getTypeVisitor().convertType(tsType);
      if (type != UniversalType && type != PointerType) {
        return type;
      }
    }
  }

  private inferIdentifier(node: ts.Identifier) {
    // is parameter of a function
    if (node.parent.kind === ts.SyntaxKind.Parameter) {
      let parentCall = ScopeUtil.findParentCallExpression(node);
      // the function is inside a call expression
      if (parentCall) {
        const propAccess = <ts.PropertyAccessExpression>parentCall.expression;
        let parentObjectType = this.inferNodeType(propAccess.expression);
        // the call expression is on an Array
        if (parentObjectType instanceof ArrayType) {
          // return the type of the Array
          return parentObjectType.elementType;
        }
      }
    }
    let varInfo = this.getTypeVisitor().getVariableInfo(<ts.Identifier>node);
    return (varInfo && varInfo.type) || null;
  }

  private inferElementAccessExpression(node: ts.ElementAccessExpression) {
    let elemAccess = <ts.ElementAccessExpression>node;
    let parentObjectType = this.inferNodeType(elemAccess.expression);
    if (parentObjectType instanceof ArrayType)
      return parentObjectType.elementType;
    else if (parentObjectType instanceof StructType)
      return parentObjectType.properties[
        elemAccess.argumentExpression.getText().slice(1, -1)
      ];
    else if (parentObjectType instanceof DictType)
      return parentObjectType.elementType;
    return null;
  }

  private inferPropertyAccessExpression(node: ts.PropertyAccessExpression) {
    let propAccess = <ts.PropertyAccessExpression>node;
    let parentObjectType = this.inferNodeType(propAccess.expression);
    if (parentObjectType instanceof StructType)
      return parentObjectType.properties[propAccess.name.getText()];
    else if (
      parentObjectType instanceof ArrayType &&
      propAccess.name.getText() === "length"
    )
      return IntegerType;
    else if (
      parentObjectType === StringType &&
      propAccess.name.getText() === "length"
    )
      return IntegerType;
    return null;
  }

  private inferCallExpression(node: ts.CallExpression) {
    let call = <ts.CallExpression>node;
    let retType = StandardCallHelper.getReturnType(this.getTypeVisitor(), call);
    if (retType) return retType;

    if (call.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
      let propAccess = <ts.PropertyAccessExpression>call.expression;
      let propName = propAccess.name.getText();
      if (
        (propName === "indexOf" || propName === "lastIndexOf") &&
        call.arguments.length === 1
      ) {
        let exprType = this.inferNodeType(propAccess.expression);
        if (exprType && exprType === StringType) return IntegerType;
      }
    } else if (call.expression.kind === ts.SyntaxKind.Identifier) {
      if (call.expression.getText() === "parseInt") {
        return IntegerType;
      }
      let funcSymbol = this.typeChecker.getSymbolAtLocation(call.expression);
      if (funcSymbol != null) {
        let funcDeclPos = funcSymbol.valueDeclaration.pos;
        return this.getTypeVisitor().getVariableType(funcDeclPos);
      }
    }
    return null;
  }

  public inferNodeType(node: ts.Node): NativeType {
    const typeVisitor = this.getTypeVisitor();

    if (!node.kind) return null;
    // Look for known registered types
    const nodeType = TypeRegistry.getNodeType(node);
    if (nodeType) {
      return nodeType;
    }
    switch (node.kind) {
      case ts.SyntaxKind.NumericLiteral:
        return this.inferNumericLiteral(<ts.NumericLiteral>node);
      case ts.SyntaxKind.BinaryExpression: {
        return this.inferBinaryExpression(<ts.BinaryExpression>node);
      }
      case ts.SyntaxKind.TrueKeyword:
      case ts.SyntaxKind.FalseKeyword:
        return BooleanType;
      case ts.SyntaxKind.StringLiteral:
        return StringType;
      case ts.SyntaxKind.Identifier: {
        return this.inferIdentifier(<ts.Identifier>node);
      }
      case ts.SyntaxKind.ElementAccessExpression: {
        return this.inferElementAccessExpression(
          <ts.ElementAccessExpression>node
        );
      }
      case ts.SyntaxKind.PropertyAccessExpression: {
        return this.inferPropertyAccessExpression(
          <ts.PropertyAccessExpression>node
        );
      }
      case ts.SyntaxKind.CallExpression: {
        return this.inferCallExpression(<ts.CallExpression>node);
      }
      case ts.SyntaxKind.PropertyAssignment:
        const propertyAssignment = <ts.PropertyAssignment>node;
        return this.inferNodeType(propertyAssignment.initializer);
      case ts.SyntaxKind.FunctionExpression:
        // TODO - Actually infer function return type
        return IntegerType;
      case ts.SyntaxKind.RegularExpressionLiteral:
        return RegexType;
      case ts.SyntaxKind.ArrayLiteralExpression:
        return typeVisitor.getArrayLiteralType(node.pos);
      case ts.SyntaxKind.ObjectLiteralExpression:
        return typeVisitor.getObjectLiteralType(node.pos);
      case ts.SyntaxKind.FunctionDeclaration: {
        return typeVisitor.getVariableType(node.pos);
      }
      default:
        {
          let tsType = this.typeChecker.getTypeAtLocation(node);
          let type = tsType && this.getTypeVisitor().convertType(tsType);
          if (type != UniversalType && type != PointerType) return type;
        }
        return null;
    }
  }
}
