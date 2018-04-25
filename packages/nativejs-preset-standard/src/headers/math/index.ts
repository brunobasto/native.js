import {
  CodeTemplate,
  Header,
  INativeExpression,
  MathHeaderType
} from "nativejs-compiler";

export class StandardMathHeader implements Header {
  public getType() {
    return MathHeaderType;
  }
  public getTemplate(): INativeExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <math.h>
`)
class Template {}
