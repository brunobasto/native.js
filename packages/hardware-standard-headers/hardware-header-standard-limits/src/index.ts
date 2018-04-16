import { Header, LimitsHeaderType } from "hardware-compiler";
import { CExpression } from "hardware-compiler";
import { IScope } from "hardware-compiler";
import { CodeTemplate } from "hardware-compiler";

export class StandardLimitsHeader implements Header {
  public getType() {
    return LimitsHeaderType;
  }
  public getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <limits.h>
`)
class Template {}
