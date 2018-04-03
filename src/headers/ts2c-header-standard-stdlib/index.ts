import { Header, StdlibHeaderType } from "../../core/header";
import { CExpression } from "../../nodes/expressions";
import { CodeTemplate } from "../../template";

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
