import {
  ArrayInsertHeaderType,
  ArrayPushHeaderType,
  CodeTemplate,
  Header,
  HeaderRegistry,
  INativeExpression
} from "nativejs-compiler";

export class StandardArrayInsertHeader implements Header {
  public getType() {
    return ArrayInsertHeaderType;
  }
  public getTemplate(): INativeExpression {
    HeaderRegistry.declareDependency(ArrayPushHeaderType);

    return new Template();
  }
}

@CodeTemplate(`
#define ARRAY_INSERT(array, pos, item) {\\
    ARRAY_PUSH(array, item); \\
    if (pos < array->size - 1) {\\
        memmove(&(array->data[(pos) + 1]), &(array->data[pos]), (array->size - (pos) - 1) * sizeof(*array->data)); \\
        array->data[pos] = item; \\
    } \\
}
`)
class Template {}
