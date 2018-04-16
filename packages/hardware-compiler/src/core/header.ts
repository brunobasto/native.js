import * as ts from "typescript";
import { CExpression } from "../nodes/expressions";
import { IScope } from "../core/program";

export interface Header {
  getType(): new () => HeaderType;
  getTemplate(params: any): CExpression;
}

export interface HeaderType {
  NAME: string;
  UNIQUE: boolean;
}

export class StringAndIntConcatHeaderType implements HeaderType {
  public NAME: string = "StringAndIntConcatHeaderType";
  public UNIQUE: boolean = true;
}

export class LimitsHeaderType implements HeaderType {
  public NAME: string = "LimitsHeaderType";
  public UNIQUE: boolean = true;
}

export class StringAndIntBufferLengthHeaderType implements HeaderType {
  public NAME: string = "StringAndIntBufferLengthHeaderType";
  public UNIQUE: boolean = true;
}

export class StringAndIntCompareHeaderType implements HeaderType {
  public NAME: string = "StringAndIntCompareHeaderType";
  public UNIQUE: boolean = true;
}

export class MathHeaderType implements HeaderType {
  public NAME: string = "MathHeaderType";
  public UNIQUE: boolean = true;
}

export class RegexMatchHeaderType implements HeaderType {
  public NAME: string = "RegexMatchHeaderType";
  public UNIQUE: boolean = true;
}

export class StringLengthHeaderType implements HeaderType {
  public NAME: string = "StringLengthHeaderType";
  public UNIQUE: boolean = true;
}

export class StringPositionHeaderType implements HeaderType {
  public NAME: string = "StringPositionHeaderType";
  public UNIQUE: boolean = true;
}

export class StringRightPositionHeaderType implements HeaderType {
  public NAME: string = "StringRightPositionHeaderType";
  public UNIQUE: boolean = true;
}

export class SubStringHeaderType implements HeaderType {
  public NAME: string = "SubStringHeaderType";
  public UNIQUE: boolean = true;
}

export class AssertHeaderType implements HeaderType {
  public NAME: string = "AssertHeaderType";
  public UNIQUE: boolean = true;
}

export class ArrayTypeHeaderType implements HeaderType {
  public NAME: string = "ArrayTypeHeaderType";
  public UNIQUE: boolean = true;
}

export class ArrayCreateHeaderType implements HeaderType {
  public NAME: string = "ArrayCreateHeaderType";
  public UNIQUE: boolean = true;
}

export class ArrayInsertHeaderType implements HeaderType {
  public NAME: string = "ArrayInsertHeaderType";
  public UNIQUE: boolean = true;
}

export class ArrayPopHeaderType implements HeaderType {
  public NAME: string = "ArrayPopHeaderType";
  public UNIQUE: boolean = true;
}

export class ArrayPushHeaderType implements HeaderType {
  public NAME: string = "ArrayPushHeaderType";
  public UNIQUE: boolean = true;
}

export class ArrayRemoveHeaderType implements HeaderType {
  public NAME: string = "ArrayRemoveHeaderType";
  public UNIQUE: boolean = true;
}

export class StdioHeaderType implements HeaderType {
  public NAME: string = "StdioHeaderType";
  public UNIQUE: boolean = true;
}

export class StdlibHeaderType implements HeaderType {
  public NAME: string = "StdlibHeaderType";
  public UNIQUE: boolean = true;
}

export class StringHeaderType implements HeaderType {
  public NAME: string = "StringHeaderType";
  public UNIQUE: boolean = true;
}

export class Uint8HeaderType implements HeaderType {
  public NAME: string = "Uint8HeaderType";
  public UNIQUE: boolean = true;
}

export class Int16HeaderType implements HeaderType {
  public NAME: string = "Int16HeaderType";
  public UNIQUE: boolean = true;
}

export class BooleanHeaderType implements HeaderType {
  public NAME: string = "BooleanHeaderType";
  public UNIQUE: boolean = true;
}

export class DictCreateHeaderType implements HeaderType {
  public NAME: string = "DictCreateHeaderType";
  public UNIQUE: boolean = true;
}

export class StructHeaderType implements HeaderType {
  public NAME: string = "StructHeaderType";
  public UNIQUE: boolean = false;
}

export class HeaderRegistry {
  private declaredHeaders = new Set<new () => HeaderType>();
  private headers = new Map<new () => HeaderType, Header>();
  private programScope: IScope = null;
  private static _instance: HeaderRegistry;
  private templates: CExpression[] = [];

  public static setProgramScope(scope: IScope) {
    this._instance.programScope = scope;
  }

  public static init() {
    this._instance = new HeaderRegistry();
  }

  public static getProgramScope() {
    return this._instance.programScope;
  }

  public static getDeclaredDependencies(): CExpression[] {
    return this._instance.templates;
  }

  public static declareDependency(
    type: new () => HeaderType,
    params: any = {}
  ) {
    const typeInstance = new type();
    if (!this._instance.headers.has(type)) {
      throw new Error(`Unregistered header of type ${typeInstance.NAME}`);
    }
    const header = this._instance.headers.get(type);
    if (!typeInstance.UNIQUE || !this._instance.declaredHeaders.has(type)) {
      this._instance.templates.push(header.getTemplate(params));
    }
    this._instance.declaredHeaders.delete(type);
    this._instance.declaredHeaders.add(type);
  }

  public static registerHeader(type: new () => HeaderType, header: Header) {
    this._instance.headers.set(type, header);
  }
}
