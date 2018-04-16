import "mocha";
import { assert, buildExpression } from "../../utils/assert";
import { evaluator } from "../../utils/evaluator";

describe("String References", () => {
  it("should return true when comparing two equal strings with '=='", done => {
    const expression = `
	var s = "10";
	const result = s == "10";
	`;
    evaluator(buildExpression(expression), actual => {
      assert(expression, actual);
      done();
    });
  });

  it("should return true when comparing return of .toString with '=='", done => {
    const expression = `
	var s = "10";
	const result = s.toString() == "10";
	`;
    evaluator(buildExpression(expression), actual => {
      assert(expression, actual);
      done();
    });
  });

  it("should return true when comparing int of same value with '=='", done => {
    const expression = `
	var s = "10";
	const result = s == 10;
	`;
    evaluator(buildExpression(expression), actual => {
      assert(expression, actual);
      done();
    });
  });

  it("should return true when comparing int expression of same value with '=='", done => {
    const expression = `
  var s = "10";
  const result = s == 2 * 5;
  `;
    evaluator(buildExpression(expression), actual => {
      assert(expression, actual);
      done();
    });
  });

  it("should return false when comparing int expression of different value with '=='", done => {
    const expression = `
  var s = "10";
  const result = s == 2 * 5 + 1;
  `;
    evaluator(buildExpression(expression), actual => {
      assert(expression, actual);
      done();
    });
  });
});
