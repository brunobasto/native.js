import { expect, use } from "chai";

use(function(_chai, _) {
  _chai.Assertion.addMethod("withMessage", function(msg) {
    _.flag(this, "message", msg);
  });
});

const buildExpression = (expression, result = "result") => `
  ${expression}
  console.log(${result});
`;

const assert = (expression, actual, expected = undefined) => {
  if (!expected) {
    expected = eval(`${expression};result`);
  }
  expect(actual)
    ["withMessage"](expression)
    .to.equal(`${expected}\n`);
};

export { assert, buildExpression };
