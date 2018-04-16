import { AssertHeaderType, Header } from "nativejs-compiler";
import { CExpression } from "nativejs-compiler";
import { IScope } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";

export class StandardAssertHeader implements Header {
  public getType() {
    return AssertHeaderType;
  }
  public getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <assert.h>
`)
class Template {}
