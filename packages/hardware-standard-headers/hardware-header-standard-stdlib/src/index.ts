import { Header, StdlibHeaderType } from "hardware-compiler";
import { CExpression } from "hardware-compiler";
import { CodeTemplate } from "hardware-compiler";

export class StandardStdLibHeader implements Header {
  public getType() {
    return StdlibHeaderType;
  }
  public getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <stdlib.h>
`)
class Template {}
