import {
  ArrayCreateHeaderType,
  AssertHeaderType,
  CExpression,
  CodeTemplate,
  Header,
  HeaderRegistry,
  StdioHeaderType,
  StdlibHeaderType,
  StringHeaderType
} from "nativejs-compiler";

export class StandardArrayCreateHeader implements Header {
  public getType() {
    return ArrayCreateHeaderType;
  }

  public getTemplate(): CExpression {
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
#define ARRAY_CREATE(array, init_capacity, init_size) {\\
    array = malloc(sizeof(*array)); \\
    array->data = malloc((init_capacity) * sizeof(*array->data)); \\
    assert(array->data != NULL); \\
    array->capacity = init_capacity; \\
    array->size = init_size; \\
}
`)
class Template {}
