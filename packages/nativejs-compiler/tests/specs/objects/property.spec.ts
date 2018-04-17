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

  it("should allow setting a property and keep initial properties", done => {
    const expression = `
  const result = {initial: "initial property"};
  result.added2 = "property 3";
  `;
    assertObjectResult(expression, done);
  });

  it("should allow mixed types of properties", done => {
    const expression = `
    const result = {};
    result["obj2"] = {
    key1: "blablabla",
    key2: 10,
    key3: [1, 2, 3],
    key4: { test: "something" }
    };
    result.obj2.key2 = 20;
    result["obj2"]["key3"][2] = 123;
  `;
    assertObjectResult(expression, done);
  });

  it("should allow assigning property values with expressions", done => {
    const expression = `
    const result = {};
    for (var x = 5; x > 0; x--) {
      result["k" + x] = x * 2;
    }
    result["a"] = 50;
    result["k3"] = 99;
    result["z"] = 100;
  `;
    assertObjectResult(expression, done);
  });

  it("should allow override existing properties", done => {
    const expression = `
    const result = {};
    for (var x = 5; x > 0; x--) {
      result["test"] = "test";
    }
  `;
    assertObjectResult(expression, done);
  });
});