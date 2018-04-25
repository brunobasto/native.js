import {
  BooleanHeaderType,
  CodeTemplate,
  Header,
  INativeExpression
} from "nativejs-compiler";

export class StandardBooleanHeader implements Header {
  public getType() {
    return BooleanHeaderType;
  }
  public getTemplate(): INativeExpression {
    return new Template();
  }
}

@CodeTemplate(`
#define TRUE 1
#define FALSE 0
`)
class Template {}
