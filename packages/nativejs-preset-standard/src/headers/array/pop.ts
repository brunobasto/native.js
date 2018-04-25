import {
  ArrayPopHeaderType,
  CodeTemplate,
  Header,
  INativeExpression
} from "nativejs-compiler";

export class StandardArrayPopHeader implements Header {
  public getType() {
    return ArrayPopHeaderType;
  }
  public getTemplate(): INativeExpression {
    return new Template();
  }
}

@CodeTemplate(`
#define ARRAY_POP_WITH_RETURN(array) (array->size != 0 ? array->data[--array->size] : 0)
#define ARRAY_POP(array) (--array->size)
`)
class Template {}
