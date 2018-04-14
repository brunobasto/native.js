import { AssertHeaderType, Header } from "hardware-compiler";
import { CExpression } from "hardware-compiler";
import { IScope } from "hardware-compiler";
import { CodeTemplate } from "hardware-compiler";

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
