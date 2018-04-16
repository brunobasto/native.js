import {
  ArrayTypeHeaderType,
  Header,
  HeaderRegistry,
  Int16HeaderType
} from "nativejs-compiler";
import { CExpression } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";

export class StandardArrayTypeHeader implements Header {
  public getType() {
    return ArrayTypeHeaderType;
  }

  public getTemplate(): CExpression {
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
