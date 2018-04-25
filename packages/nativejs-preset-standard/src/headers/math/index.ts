import {
  CExpression,
  CodeTemplate,
  Header,
  MathHeaderType
} from "nativejs-compiler";

export class StandardMathHeader implements Header {
  public getType() {
    return MathHeaderType;
  }
  public getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <math.h>
`)
class Template {}
