import debug from "debug";
import { evaluator } from "./evaluator";
import { expect, use } from "chai";

const log = debug("assert");

use(function(_chai, _) {
  _chai.Assertion.addMethod("withMessage", function(msg) {
    _.flag(this, "message", msg);
  });
});

const buildExpression = (expression, result = "result") => `
  ${expression}
  console.log(${result});
`;

const assertStringResult = (
  expression,
  callback: Function,
  expected = undefined
) => {
  evaluator(buildExpression(expression), actual => {
    if (!expected) {
      expected = eval(`${expression};result`);
    }
    expect(actual)
      ["withMessage"](expression)
      .to.equal(`${expected}\n`);
    callback();
  });
};

const assertArrayResult = (expression, callback: Function) => {
  evaluator(buildExpression(expression), actual => {
    const expected = eval(`${expression};result`);
    log("parsing", actual);
    expect(JSON.parse(actual))
      ["withMessage"](expression)
      .to.deep.equal(expected);
    callback();
  });
};

const assertObjectResult = (expression, callback: Function) => {
  evaluator(buildExpression(expression), actual => {
    const expected = eval(`${expression};result`);
    log("parsing", actual);
    expect(JSON.parse(actual))
      ["withMessage"](expression)
      .to.deep.equal(expected);
    callback();
  });
};

export { assertStringResult, assertArrayResult, assertObjectResult };
