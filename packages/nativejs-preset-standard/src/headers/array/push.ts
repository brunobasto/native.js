import {
  ArrayPushHeaderType,
  AssertHeaderType,
  CodeTemplate,
  Header,
  HeaderRegistry,
  INativeExpression,
  StdioHeaderType,
  StdlibHeaderType,
  StringHeaderType
} from "nativejs-compiler";

export class StandardArrayPushHeader implements Header {
  public getType() {
    return ArrayPushHeaderType;
  }

  public getTemplate(): INativeExpression {
    HeaderRegistry.declareDependency(StdlibHeaderType);
    // sizeof depend on stdio.h
    HeaderRegistry.declareDependency(StdioHeaderType);
    // strcat depend on string.h
    HeaderRegistry.declareDependency(StringHeaderType);
    //
    HeaderRegistry.declareDependency(AssertHeaderType);

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
