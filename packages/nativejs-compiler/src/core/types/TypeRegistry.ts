import * as ts from "typescript";
import { NativeType } from "./NativeTypes";

export class TypeRegistry {
  private typesMap = new Map<number, NativeType>();
  private static _instance: TypeRegistry;

  public static init() {
    this._instance = new TypeRegistry();
  }
  public static getNodeType(node: ts.Node) {
    return this._instance.typesMap.get(node.pos);
  }

  public static declareNodeType(node: ts.Node, type: NativeType) {
    this._instance.typesMap.set(node.pos, type);
  }
}
