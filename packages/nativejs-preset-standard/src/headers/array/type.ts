import {
  ArrayTypeHeaderType,
  CodeTemplate,
  Header,
  HeaderRegistry,
  INativeExpression,
  Int16HeaderType
} from "nativejs-compiler";

export class StandardArrayTypeHeader implements Header {
  public getType() {
    return ArrayTypeHeaderType;
  }

  public getTemplate(): INativeExpression {
    HeaderRegistry.declareDependency(Int16HeaderType);

    return new Template();
  }
}

@CodeTemplate(`
#define ARRAY(T) struct {\\
    int16_t size;\\
    int16_t capacity;\\
    T *data;\\
} *
`)
class Template {}
