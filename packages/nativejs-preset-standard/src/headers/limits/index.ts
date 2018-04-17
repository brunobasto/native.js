import { Header, LimitsHeaderType } from "nativejs-compiler";
import { CExpression } from "nativejs-compiler";
import { IScope } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";

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
