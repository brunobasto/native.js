import { Header, MathHeaderType } from "../../core/header";
import { CExpression } from "../../nodes/expressions";
import { CodeTemplate } from "../../template";

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
