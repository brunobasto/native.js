import { ArrayRemoveHeaderType, Header } from "../../core/header";
import { CExpression } from "../../nodes/expressions";
import { CodeTemplate } from "../../template";

export class StandardArrayRemoveHeader implements Header {
  public getType() {
    return ArrayRemoveHeaderType;
  }
  public getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
#define ARRAY_REMOVE(array, pos, num) {\\
    memmove(&(array->data[pos]), &(array->data[(pos) + num]), (array->size - (pos) - num) * sizeof(*array->data)); \\
    array->size -= num; \\
}
`)
class Template {}
