import "mocha";
import { assertArray, buildExpression } from "../../utils/assert";
import { evaluator } from "../../utils/evaluator";
import { expect, use } from "chai";

describe("Array Literals", () => {
  it("should create an array of integers", done => {
    const expression = `
	const result = [10, 20, 30];
	`;
    evaluator(buildExpression(expression), actual => {
      assertArray(expression, actual);
      done();
    });
  });

  xit("should create an array of booleans", done => {
    const expression = `
	const result = [true, false, true];
	`;
    evaluator(buildExpression(expression), actual => {
      assertArray(expression, actual);
      done();
    });
  });

  xit("should create an array of arrays", done => {
    const expression = `
	const result = [[1, 2], [3, 4], [5, 6]];
	`;
    evaluator(buildExpression(expression), actual => {
      assertArray(expression, actual);
      done();
    });
  });

  it("should create an array of objects", done => {
    const expression = `
	const result = [{value: 1}, {value: 2}, {value: 3}];
	`;
    evaluator(buildExpression(expression), actual => {
      assertArray(expression, actual);
      done();
    });
  });

  xit("should create an array of floats", done => {
    const expression = `
	const result = [10.3, 20.4, 30.5];
	`;
    evaluator(buildExpression(expression), actual => {
      assertArray(expression, actual);
      done();
    });
  });

  xit("should create an array of longs", done => {
    const expression = `
	const result = [500000, 100000000, 24234344233224324];
	`;
    evaluator(buildExpression(expression), actual => {
      assertArray(expression, actual);
      done();
    });
  });

  it("should create an array of strings", done => {
    const expression = `
	const result = ["Hello", "World"];
	`;
    evaluator(buildExpression(expression), actual => {
      assertArray(expression, actual);
      done();
    });
  });
});
