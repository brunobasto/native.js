import {
  ArrayInsertHeaderType,
  ArrayPushHeaderType,
  Header,
  HeaderRegistry
} from "../../core/header";
import { CExpression } from "../../nodes/expressions";
import { CodeTemplate } from "../../template";

export class StandardArrayInsertHeader implements Header {
  public getType() {
    return ArrayInsertHeaderType;
  }
  public getTemplate(): CExpression {
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
