import { BooleanHeaderType, Header } from "nativejs-compiler";
import { CExpression } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";

export class StandardBooleanHeader implements Header {
  public getType() {
    return BooleanHeaderType;
  }
  public getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
#define TRUE 1
#define FALSE 0
`)
class Template {}
