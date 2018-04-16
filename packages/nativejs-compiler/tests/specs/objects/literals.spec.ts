import "mocha";
import { assertObjectResult } from "../../utils/assert";

describe("Object Literals", () => {
  it("should a literal object with string value", done => {
    const expression = `
	const result = { hello: "World" };
	`;
    assertObjectResult(expression, done);
  });

  it("should a literal object with integer value", done => {
    const expression = `
	const result = { hello: 10 };
	`;
    assertObjectResult(expression, done);
  });

  it("should a literal object with float value", done => {
    const expression = `
	const result = { hello: 5.5 };
	`;
    assertObjectResult(expression, done);
  });

  it("should a literal object with mixed types", done => {
    const expression = `
	const result = { hello: 5.5, world: "Hey" };
	`;
    assertObjectResult(expression, done);
  });
});
