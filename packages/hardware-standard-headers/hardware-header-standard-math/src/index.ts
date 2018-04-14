import { Header, MathHeaderType } from "hardware-compiler";
import { CExpression } from "hardware-compiler";
import { CodeTemplate } from "hardware-compiler";

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
