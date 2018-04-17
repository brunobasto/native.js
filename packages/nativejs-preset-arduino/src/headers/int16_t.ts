import { CExpression } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";
import { Header, HeaderRegistry, Int16HeaderType } from "nativejs-compiler";
import { IOHeaderType } from "./io";

export class Int16Header implements Header {
  getType() {
    return Int16HeaderType;
  }

  getTemplate(): CExpression {
    HeaderRegistry.declareDependency(IOHeaderType);

    return new Template();
  }
}

@CodeTemplate(``)
class Template {}
