import { Header, Int16HeaderType } from "hardware-compiler";
import { CExpression } from "hardware-compiler";
import { IScope } from "hardware-compiler";
import { CodeTemplate } from "hardware-compiler";

export class StandardInt16Header implements Header {
  public getType() {
    return Int16HeaderType;
  }
  public getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
typedef short int16_t;
`)
class Template {}
