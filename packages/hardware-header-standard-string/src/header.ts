import { Header, StringHeaderType } from "hardware-compiler";
import { CExpression } from "hardware-compiler";
import { IScope } from "hardware-compiler";
import { CodeTemplate } from "hardware-compiler";

export class StandardStringHeader implements Header {
  public getType() {
    return StringHeaderType;
  }
  public getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <string.h>
`)
class Template {}
