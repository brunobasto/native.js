import "mocha";
import { assertObjectResult } from "../../utils/assert";

describe("Object Properties", () => {
  it("should allow setting a property on an object with brackets", done => {
    const expression = `
	const result = {};
	result["hello"] = "world";
	`;
    assertObjectResult(expression, done);
  });

  it("should allow setting a property on an object with dot", done => {
    const expression = `
	const result = {};
	result.added2 = "property 3";
	`;
    assertObjectResult(expression, done);
  });
});
