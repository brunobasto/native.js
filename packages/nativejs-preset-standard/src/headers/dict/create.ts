import {
  ArrayCreateHeaderType,
  ArrayPushHeaderType,
  ArrayTypeHeaderType,
  CodeTemplate,
  DictCreateHeaderType,
  Header,
  HeaderRegistry,
  HeaderType,
  INativeExpression,
  Int16HeaderType,
  StdioHeaderType,
  StdlibHeaderType,
  StringHeaderType
} from "nativejs-compiler";

export class StandardDictCreateHeader implements Header {
  public getType() {
    return DictCreateHeaderType;
  }

  public getTemplate(): INativeExpression {
    HeaderRegistry.declareDependency(StdlibHeaderType);
    HeaderRegistry.declareDependency(ArrayTypeHeaderType);
    HeaderRegistry.declareDependency(ArrayCreateHeaderType);
    HeaderRegistry.declareDependency(ArrayPushHeaderType);
    HeaderRegistry.declareDependency(Int16HeaderType);

    return new Template();
  }
}

/* tslint:disable:max-line-length */
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
    if (keys_size == 0 || key == NULL)
        return -1;
    while (low < keys_size) {
        if (strcmp(keys[low], key) == 0)
            return low;
        low++;
    }
    return -1;
}
int16_t tmp_dict_pos;

#define DICT_GET(dict, prop) ((tmp_dict_pos = dict_find_pos(dict->index->data, dict->index->size, prop)) < 0 ? 0 : dict->values->data[tmp_dict_pos])

#define DICT_SET_STR_INT(dict, prop, value) do { \\
    tmp_dict_pos = dict_find_pos(dict->index->data, dict->index->size, prop); \\
    if (tmp_dict_pos < 0) { \\
        char * tempKey = malloc(1 + strlen(prop)); \\
        strcpy(tempKey, prop); \\
        ARRAY_PUSH(dict->index, tempKey); \\
        ARRAY_PUSH(dict->values, value); \\
    } else { \\
        char * tempKey = malloc(1 + strlen(prop)); \\
        strcpy(tempKey, prop); \\
        free((void *)dict->index->data[tmp_dict_pos]); \\
        dict->index->data[tmp_dict_pos] = tempKey; \\
        dict->values->data[tmp_dict_pos] = value; \\
    } \\
} while(0)

#define DICT_SET_STR_STR(dict, prop, value) do { \\
    tmp_dict_pos = dict_find_pos(dict->index->data, dict->index->size, prop); \\
    if (tmp_dict_pos < 0) { \\
        char * tempKey = malloc(1 + strlen(prop)); \\
        strcpy(tempKey, prop); \\
        ARRAY_PUSH(dict->index, tempKey); \\
        char * tempValue = malloc(1 + strlen(value)); \\
        strcpy(tempValue, value); \\
        ARRAY_PUSH(dict->values, tempValue); \\
    } else { \\
        free((void *)dict->index->data[tmp_dict_pos]); \\
        char * tempKey = malloc(1 + strlen(prop)); \\
        strcpy(tempKey, prop); \\
        dict->index->data[tmp_dict_pos] = tempKey; \\
        free((void *)dict->values->data[tmp_dict_pos]); \\
        char * tempValue = malloc(1 + strlen(value)); \\
        strcpy(tempValue, value); \\
        dict->values->data[tmp_dict_pos] = tempValue; \\
    } \
} while(0)
`)
class Template {}
/* tslint:enable:max-line-length */
