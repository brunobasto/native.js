import * as ts from "typescript";
import {
  ArrayType,
  IntegerType,
  NativeType,
  PointerType,
  StructType
} from "./NativeTypes";
import { PropertiesDictionary } from "./PropertiesDictionary";
import { TypeVisitor } from "./TypeVisitor";

interface StructData { [name: string]: StructType; }

export class Structures {
  private declaredStructs: StructData = {};

  constructor(
    private typeChecker: ts.TypeChecker,
    private typeVisitor: TypeVisitor
  ) {}

  public declare(name: string, struct: StructType) {
    this.declaredStructs[name] = struct;
  }

  private getStructureBodyString(properties: PropertiesDictionary) {
    let userStructCode = "{\n";
    for (const propName in properties) {
      const propType = properties[propName];
      if (typeof propType === "string") {
        userStructCode += "    " + propType + " " + propName + ";\n";
      } else if (propType instanceof ArrayType) {
        const propTypeText = propType.getText();
        if (propTypeText.indexOf("{var}") > -1) {
          userStructCode +=
            "    " +
            propTypeText.replace(/^static /, "").replace("{var}", propName) +
            ";\n";
        } else { userStructCode += "    " + propTypeText + " " + propName + ";\n"; }
      } else {
        userStructCode += "    " + propType.getText() + " " + propName + ";\n";
      }
    }
    userStructCode += "};\n";
    return userStructCode;
  }

  public generateStructure(tsType: ts.Type, ident?: ts.Identifier): StructType {
    let structName =
      "struct_" + Object.keys(this.declaredStructs).length + "_t";
    const varName = ident && ident.getText();
    if (varName) {
      if (this.declaredStructs[varName + "_t"] === null) {
        structName = varName + "_t";
      } else {
        let i = 2;
        while (this.declaredStructs[varName + "_" + i + "_t"] != null) { i++; }
        structName = varName + "_" + i + "_t";
      }
    }
    const userStructInfo: PropertiesDictionary = {};
    for (const prop of tsType.getProperties()) {
      const propTsType = this.typeChecker.getTypeOfSymbolAtLocation(
        prop,
        prop.valueDeclaration
      );
      let propType = this.typeVisitor.convertType(
        propTsType,
        prop.valueDeclaration as ts.Identifier
      );
      if (
        propType === PointerType &&
        prop.valueDeclaration.kind === ts.SyntaxKind.PropertyAssignment
      ) {
        const propAssignment = prop.valueDeclaration as ts.PropertyAssignment;
        if (
          propAssignment.initializer &&
          propAssignment.initializer.kind ==
            ts.SyntaxKind.ArrayLiteralExpression
        ) {
          propType = this.typeVisitor.determineArrayType(
            propAssignment.initializer as ts.ArrayLiteralExpression
          );
        }
      }
      userStructInfo[prop.name] = propType;
    }

    const userStructCode = this.getStructureBodyString(userStructInfo);

    let found = false;
    if (Object.keys(userStructInfo).length > 0) {
      for (const s in this.declaredStructs) {
        if (
          this.getStructureBodyString(this.declaredStructs[s].properties) ==
          userStructCode
        ) {
          structName = s;
          found = true;
          break;
        }
      }
    }

    if (!found) {
      this.declaredStructs[structName] = new StructType(
        "struct " + structName + " *",
        userStructInfo
      );
    }
    return this.declaredStructs[structName];
  }

  public getDeclaredStructs() {
    return Object.keys(this.declaredStructs)
      .filter(k => Object.keys(this.declaredStructs[k].properties).length > 0)
      .map(k => {
        return {
          name: k,
          properties: Object.keys(this.declaredStructs[k].properties).map(
            pk => {
              return {
                name: pk,
                type: this.declaredStructs[k].properties[pk]
              };
            }
          )
        };
      });
  }
}
