import {
  ArrayPushHeaderType,
  AssertHeaderType,
  Header,
  HeaderRegistry,
  StdioHeaderType,
  StdlibHeaderType,
  StringHeaderType
} from "../../core/header";
import { CExpression } from "../../nodes/expressions";
import { CodeTemplate } from "../../template";

export class StandardArrayPushHeader implements Header {
  public getType() {
    return ArrayPushHeaderType;
  }
  constructor() {
    HeaderRegistry.declareDependency(StdlibHeaderType);
    // sizeof depend on stdio.h
    HeaderRegistry.declareDependency(StdioHeaderType);
    // strcat depend on string.h
    HeaderRegistry.declareDependency(StringHeaderType);
    //
    HeaderRegistry.declareDependency(AssertHeaderType);
  }

  public getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
#define ARRAY_PUSH(array, item) {\\
    if (array->size == array->capacity) {  \\
        array->capacity += 1;  \\
        array->data = realloc(array->data, array->capacity * sizeof(*array->data)); \\
        assert(array->data != NULL); \\
    }  \\
    array->data[array->size++] = item; \\
}
`)
class Template {}
