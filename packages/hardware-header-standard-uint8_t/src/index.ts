import { Header, Uint8HeaderType } from "hardware-compiler";
import { CExpression } from "hardware-compiler";
import { CodeTemplate } from "hardware-compiler";

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
