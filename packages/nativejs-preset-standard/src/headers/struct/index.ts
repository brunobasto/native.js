import {
  CodeTemplate,
  CVariable,
  Header,
  HeaderRegistry,
  INativeExpression,
  IScope,
  StructHeaderType
} from "nativejs-compiler";

export class StandardStructHeader implements Header {
  public getType() {
    return StructHeaderType;
  }
  public getTemplate(params: any): INativeExpression {
    const scope = HeaderRegistry.getProgramScope();

    return new Template(scope, params);
  }
}

@CodeTemplate(`
struct {name} {\n    {properties {    }=> {this};\n}};\n
`)
class Template {
  public properties: any;
  public name: string;

  constructor(scope: IScope, params: any) {
    const { name, properties } = params;
    this.name = name;
    this.properties = properties.map((property: any) => {
      return new CVariable(scope, property.name, property.type, {
        removeStorageSpecifier: true
      });
    });
  }
}
