import {
  CExpression,
  CodeTemplate,
  Header,
  Uint8HeaderType
} from "nativejs-compiler";

export class StandardUint8Header implements Header {
  public getType() {
    return Uint8HeaderType;
  }
  public getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
typedef unsigned char uint8_t;
`)
class Template {}
