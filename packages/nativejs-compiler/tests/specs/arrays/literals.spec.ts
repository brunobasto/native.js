import "mocha";
import { assertArrayResult } from "../../utils/assert";
import { evaluator } from "../../utils/evaluator";
import { expect, use } from "chai";

describe("Array Literals", () => {
  it("should create an array of integers", done => {
    const expression = `
	const result = [10, 20, 30];
	`;
    assertArrayResult(expression, done);
  });

  it("should create an array of booleans", done => {
    const expression = `
	const result = [true, false, true];
	`;
    assertArrayResult(expression, done);
  });

  xit("should create an array of arrays", done => {
    const expression = `
	const result = [[1, 2], [3, 4], [5, 6]];
	`;
    assertArrayResult(expression, done);
  });

  it("should create an array of objects", done => {
    const expression = `
	const result = [{value: 1}, {value: 2}, {value: 3}];
	`;
    assertArrayResult(expression, done);
  });

  it("should create an array of objects with arrays", done => {
    const expression = `
  const result = [{value: [0, 1]}, {value: [2, 3]}, {value: [4, 5]}];
  `;
    assertArrayResult(expression, done);
  });

  it("should create an array of floats", done => {
    const expression = `
	const result = [10.3, 20.4, 30.5];
	`;
    assertArrayResult(expression, done);
  });

  it("should create an array of longs", done => {
    const expression = `
	const result = [500000, 100000000, 24234344233224324];
	`;
    assertArrayResult(expression, done);
  });

  it("should create an array of strings", done => {
    const expression = `
	const result = ["Hello", "World"];
	`;
    assertArrayResult(expression, done);
  });
});
