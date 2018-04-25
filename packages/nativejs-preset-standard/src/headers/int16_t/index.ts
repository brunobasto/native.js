import {
  CExpression,
  CodeTemplate,
  Header,
  Int16HeaderType,
  IScope
} from "nativejs-compiler";

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
