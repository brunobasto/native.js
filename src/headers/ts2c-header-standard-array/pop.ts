import { ArrayPopHeaderType, Header } from "../../core/header";
import { CExpression } from "../../nodes/expressions";
import { CodeTemplate } from "../../template";

export class StandardArrayPopHeader implements Header {
  public getType() {
    return ArrayPopHeaderType;
  }
  public getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
#define ARRAY_POP(a) (a->size != 0 ? a->data[--a->size] : 0)
`)
class Template {}
