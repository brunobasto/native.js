import { Header, Int16HeaderType } from "nativejs-compiler";
import { CExpression } from "nativejs-compiler";
import { IScope } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";

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
