import {
  ArrayCreateHeaderType,
  ArrayInsertHeaderType,
  ArrayTypeHeaderType,
  ArrayRemoveHeaderType,
  DictCreateHeaderType,
  Header,
  HeaderRegistry,
  HeaderType,
  StdioHeaderType,
  StdlibHeaderType,
  StringHeaderType
} from "../../core/header";
import { CExpression } from "../../nodes/expressions";
import { CodeTemplate } from "../../template";

export class StandardDictCreateHeader implements Header {
  public getType() {
    return DictCreateHeaderType;
  }

  constructor() {
    HeaderRegistry.declareDependency(StdlibHeaderType);
    HeaderRegistry.declareDependency(ArrayTypeHeaderType);
    HeaderRegistry.declareDependency(ArrayCreateHeaderType);
    HeaderRegistry.declareDependency(ArrayInsertHeaderType);
  }

  public getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
#define DICT(T) struct { \\
    ARRAY(const char *) index; \\
    ARRAY(T) values; \\
} *
#define DICT_CREATE(dict, init_capacity) { \\
    dict = malloc(sizeof(*dict)); \\
    ARRAY_CREATE(dict->index, init_capacity, 0); \\
    ARRAY_CREATE(dict->values, init_capacity, 0); \\
}
int16_t dict_find_pos(const char ** keys, int16_t keys_size, const char * key) {
    int16_t low = 0;
    int16_t high = keys_size - 1;

    if (keys_size == 0 || key == NULL)
        return -1;

    while (low <= high)
    {
        int mid = (low + high) / 2;
        int res = strcmp(keys[mid], key);

        if (res == 0)
            return mid;
        else if (res < 0)
            low = mid + 1;
        else
            high = mid - 1;
    }

    return -1 - low;
}
int16_t tmp_dict_pos;
#define DICT_GET(dict, prop) ((tmp_dict_pos = dict_find_pos(dict->index->data, dict->index->size, prop)) < 0 ? 0 : dict->values->data[tmp_dict_pos])
#define DICT_SET(dict, prop, value) { \\
    tmp_dict_pos = dict_find_pos(dict->index->data, dict->index->size, prop); \\
    if (tmp_dict_pos < 0) { \\
        tmp_dict_pos = -tmp_dict_pos - 1; \\
        ARRAY_INSERT(dict->index, tmp_dict_pos, prop); \\
        ARRAY_INSERT(dict->values, tmp_dict_pos, value); \\
    } else { \\
      free((void *)dict->index->data[tmp_dict_pos]); \\
      dict->index->data[tmp_dict_pos] = prop; \\
      dict->values->data[tmp_dict_pos] = value; \\
    } \
}
`)
class Template {}
