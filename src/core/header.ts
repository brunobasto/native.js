import * as ts from "typescript";
import { CExpression } from "../nodes/expressions";
import { IScope } from "../program";

const declaredHeaders = new Set<new () => HeaderType>();

export interface Header {
  getType(): new () => HeaderType;
  getTemplate(): CExpression;
}

export interface HeaderType {
  NAME: string;
}

export class AssertHeaderType implements HeaderType {
  public NAME: string = "AssertHeaderType";
}

export class ArrayTypeHeaderType implements HeaderType {
  public NAME: string = "ArrayTypeHeaderType";
}

export class ArrayCreateHeaderType implements HeaderType {
  public NAME: string = "ArrayCreateHeaderType";
}

export class ArrayInsertHeaderType implements HeaderType {
  public NAME: string = "ArrayInsertHeaderType";
}

export class ArrayPopHeaderType implements HeaderType {
  public NAME: string = "ArrayPopHeaderType";
}

export class ArrayPushHeaderType implements HeaderType {
  public NAME: string = "ArrayPushHeaderType";
}

export class ArrayRemoveHeaderType implements HeaderType {
  public NAME: string = "ArrayRemoveHeaderType";
}

export class StdioHeaderType implements HeaderType {
  public NAME: string = "StdioHeaderType";
}

export class StdlibHeaderType implements HeaderType {
  public NAME: string = "StdlibHeaderType";
}

export class StringHeaderType implements HeaderType {
  public NAME: string = "StringHeaderType";
}

export class Uint8HeaderType implements HeaderType {
  public NAME: string = "Uint8HeaderType";
}

export class Int16HeaderType implements HeaderType {
  public NAME: string = "Int16HeaderType";
}

export class BooleanHeaderType implements HeaderType {
  public NAME: string = "BooleanHeaderType";
}

export class DictCreateHeaderType implements HeaderType {
  public NAME: string = "DictCreateHeaderType";
}

const headers = new Map<new () => HeaderType, Header>();

export class HeaderRegistry {
  public static getDeclaredDependencies(): CExpression[] {
    const templates: CExpression[] = [];

    for (const type of declaredHeaders) {
      if (!headers.has(type)) {
        throw new Error(`Unregistered header of type '${new type().NAME}'`);
      }
      templates.push(headers.get(type).getTemplate());
    }

    return templates;
  }

  public static declareDependency(type: new () => HeaderType) {
    declaredHeaders.add(type);
  }

  public static registerHeader(type: new () => HeaderType, header: Header) {
    headers.set(type, header);
  }
}
