import {
  CodeTemplate,
  Header,
  INativeExpression,
  Uint8HeaderType
} from "nativejs-compiler";

export class StandardUint8Header implements Header {
  public getType() {
    return Uint8HeaderType;
  }
  public getTemplate(): INativeExpression {
    return new Template();
  }
}

@CodeTemplate(`
typedef unsigned char uint8_t;
`)
class Template {}
