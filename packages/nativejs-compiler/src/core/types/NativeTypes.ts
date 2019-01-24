import { PropertiesDictionary } from "./PropertiesDictionary";

export const BooleanType = "uint8_t";
export const FloatType = "float";
export const IntegerType = "int16_t";
export const LongType = "unsigned long";
export const PointerType = "void *";
export const RegexMatchType = "struct regex_match_struct_t";
export const RegexType = "struct regex_struct_t";
export const SignedType = "long";
export const StringType = "const char *";
export const UniversalType = "struct js_let *";

/** Type that represents static or dynamic array */

export interface INativeType {
  type: string
}

export class ArrayType implements INativeType {
  public type: string = 'ArrayType';
  private structName: string;

  public static getArrayStructName(elementTypeText: string) {
    while (elementTypeText.indexOf(IntegerType) > -1) {
      elementTypeText = elementTypeText.replace(IntegerType, "number");
    }
    while (elementTypeText.indexOf(StringType) > -1) {
      elementTypeText = elementTypeText.replace(StringType, "string");
    }
    while (elementTypeText.indexOf(PointerType) > -1) {
      elementTypeText = elementTypeText.replace(PointerType, "pointer");
    }
    while (elementTypeText.indexOf(BooleanType) > -1) {
      elementTypeText = elementTypeText.replace(BooleanType, "bool");
    }

    elementTypeText = elementTypeText.replace(
      /^struct array_(.*)_t \*$/,
      (all, g1) => "array_" + g1
    );

    return (
      "array_" +
      elementTypeText
        .replace(/^static /, "")
        .replace("{var}", "")
        .replace(/[\[\]]/g, "")
        .replace(/ /g, "_")
        .replace(/const char \*/g, "string")
        .replace(/\*/g, "8") +
      "_t"
    );
  }

  public getText() {
    const elementType = this.elementType;
    let elementTypeText;
    if (typeof elementType === "string") { elementTypeText = elementType; } else { elementTypeText = elementType.getText(); }

    this.structName = ArrayType.getArrayStructName(elementTypeText);

    if (this.isDynamicArray) { return "struct " + this.structName + " *"; } else { return "static " + elementTypeText + " {var}[" + this.capacity + "]"; }
  }
  constructor(
    public elementType: NativeType,
    public capacity: number,
    public isDynamicArray: boolean
  ) {}
}

/** Type that represents JS object with dynamic properties (implemented as dynamic dictionary) */
export class DictType implements INativeType {
  public type: 'DictType'

  public getText() {
    const elementType = this.elementType;
    let elementTypeText;
    if (typeof elementType === "string") { elementTypeText = elementType; } else { elementTypeText = elementType.getText(); }

    return "DICT(" + elementTypeText + ")";
  }
  constructor(public elementType: NativeType) {}
}

/** Type that represents JS object with static properties (implemented as C struct) */
export class StructType implements INativeType {
  public type: 'StructType'

  public getText() {
    return this.structName;
  }
  constructor(
    private structName: string,
    public properties: PropertiesDictionary
  ) {}
}

export type NativeType = string | StructType | ArrayType | DictType;

export function isNumericType(type: NativeType) {
  return (
    type === IntegerType ||
    type === LongType ||
    type === FloatType ||
    type === SignedType
  );
}