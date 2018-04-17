import { Header, MathHeaderType } from "nativejs-compiler";
import { CExpression } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";

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
