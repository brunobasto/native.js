import * as ts from "typescript";
import { CExpression } from "../nodes/expressions";
import { IScope } from "../core/program";

const declaredHeaders = new Set<new () => HeaderType>();

export interface Header {
  getType(): new () => HeaderType;
  getTemplate(params: any): CExpression;
}

export interface HeaderType {
  NAME: string;
  UNIQUE: boolean;
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

const headers = new Map<new () => HeaderType, Header>();

const templates: CExpression[] = [];

let programScope: IScope = null;

export class HeaderRegistry {
  public static setProgramScope(scope: IScope) {
    programScope = scope;
  }

  public static getProgramScope() {
    return programScope;
  }

  public static getDeclaredDependencies(): CExpression[] {
    return templates;
  }

  public static declareDependency(type: new () => HeaderType, params: any = {}) {
    const typeInstance = new type();
    if (!headers.has(type)) {
      throw new Error(`Unregistered header of type ${typeInstance.NAME}`);
    }
    const header = headers.get(type);
    if (!typeInstance.UNIQUE || !declaredHeaders.has(type)) {
      templates.push(header.getTemplate(params));
    }
    declaredHeaders.delete(type);
    declaredHeaders.add(type);
  }

  public static registerHeader(type: new () => HeaderType, header: Header) {
    headers.set(type, header);
  }
}
