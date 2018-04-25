import { INativeExpression } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";
import { Header, HeaderRegistry, Int16HeaderType } from "nativejs-compiler";
import { IOHeaderType } from "./io";

export class Int16Header implements Header {
  public getType() {
    return Int16HeaderType;
  }

  public getTemplate(): INativeExpression {
    HeaderRegistry.declareDependency(IOHeaderType);

    return new Template();
  }
}

@CodeTemplate(``)
class Template {}
