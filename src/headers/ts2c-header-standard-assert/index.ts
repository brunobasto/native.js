import * as ts from "typescript";
import { AssertHeaderType, Header } from "../../core/header";
import { CExpression } from "../../nodes/expressions";
import { IScope } from "../../program";
import { CodeTemplate } from "../../template";

export class StandardAssertHeader implements Header {
  public getType() {
    return AssertHeaderType;
  }
  public getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <assert.h>
`)
class Template {}
