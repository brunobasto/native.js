import { ArrayTypeHeaderType, Header, HeaderRegistry, Int16HeaderType } from "../../core/header";
import { CExpression } from "../../nodes/expressions";
import { CodeTemplate } from "../../template";

export class StandardArrayTypeHeader implements Header {
  constructor() {
  	HeaderRegistry.declareDependency(Int16HeaderType);
  }

  public getType() {
    return ArrayTypeHeaderType;
  }

  public getTemplate(): CExpression {
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
