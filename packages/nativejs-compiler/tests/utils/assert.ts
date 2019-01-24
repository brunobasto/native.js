import { expect, use } from "chai";
import debug from "debug";
import { evaluator } from "./evaluator";

const log = debug("assert");

use((chaiInstance, _) => {
  chaiInstance.Assertion.addMethod("withMessage", msg => {
    _.flag(this, "message", msg);
  });
});

const buildExpression = (expression, result = "result") => `
  ${expression}
  console.log(${result});
`;

const assertStringResult = (
  expression,
  callback: () => void,
  expected = undefined
) => {
  evaluator(buildExpression(expression), actual => {
    if (!expected) {
      /* tslint:disable:no-eval */
      expected = eval(`${expression};result`);
      /* tslint:enable:no-eval */
    }
    expect(actual)
      ["withMessage"](expression)
      .to.equal(`${expected}\n`);
    callback();
  });
};

const assertArrayResult = (expression, callback: () => void) => {
  evaluator(buildExpression(expression), actual => {
    /* tslint:disable:no-eval */
    const expected = eval(`${expression};result`);
    /* tslint:enable:no-eval */
    log("parsing", actual);
    expect(JSON.parse(actual))
      ["withMessage"](expression)
      .to.deep.equal(expected);
    callback();
  });
};

const assertObjectResult = (expression, callback: () => void) => {
  evaluator(buildExpression(expression), actual => {
    /* tslint:disable:no-eval */
    const expected = eval(`${expression};result`);
    /* tslint:enable:no-eval */
    log("parsing", actual);
    expect(JSON.parse(actual))
      ["withMessage"](expression)
      .to.deep.equal(expected);
    callback();
  });
};

export { assertStringResult, assertArrayResult, assertObjectResult };
