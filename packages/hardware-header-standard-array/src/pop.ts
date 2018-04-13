import { ArrayPopHeaderType, Header } from "hardware-compiler";
import { CExpression } from "hardware-compiler";
import { CodeTemplate } from "hardware-compiler";

export class StandardArrayPopHeader implements Header {
  public getType() {
    return ArrayPopHeaderType;
  }
  public getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
#define ARRAY_POP(array, useReturnValue) ((useReturnValue) == 0 ? (--array->size) : ((array->size != 0 ? array->data[--array->size] : 0)))
`)
class Template {}
