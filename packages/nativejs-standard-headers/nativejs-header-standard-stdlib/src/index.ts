import { Header, StdlibHeaderType } from "nativejs-compiler";
import { CExpression } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";

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
