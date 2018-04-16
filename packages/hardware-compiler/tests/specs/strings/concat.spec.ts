import "mocha";
import { assert, buildExpression } from "../../utils/assert";
import { evaluator } from "../../utils/evaluator";

describe("String Concatenation", () => {
  it("should be able to concat two string references", done => {
    const expression = `
	var s1 = "Hello";
  var s2 = "World";
  const result = s1 + s2;
	`;
    evaluator(buildExpression(expression), actual => {
      assert(expression, actual);
      done();
    });
  });

  it("should be able to concat two string literals", done => {
    const expression = `
  const result = "Hello" + "World";
  `;
    evaluator(buildExpression(expression), actual => {
      assert(expression, actual);
      done();
    });
  });

  it("should be able to concat a string literal and an int", done => {
    const expression = `
  const result = "Hello" + 50;
  `;
    evaluator(buildExpression(expression), actual => {
      assert(expression, actual);
      done();
    });
  });

  it("should be able to concat a string reference and an int", done => {
    const expression = `
    const s1 = "Hello";
    const result = s1 + 50;
  `;
    evaluator(buildExpression(expression), actual => {
      assert(expression, actual);
      done();
    });
  });

  it("should be able to concat two string references and an int", done => {
    const expression = `
    const s1 = "Hello";
    const s2 = "World"
    const result = s1 + 50 + s2;
  `;
    evaluator(buildExpression(expression), actual => {
      assert(expression, actual);
      done();
    });
  });

  it("should be able to concat with .concat and a string literal", done => {
    const expression = `
    const s1 = "Hello";
    const result = s1.concat("World");
  `;
    evaluator(buildExpression(expression), actual => {
      assert(expression, actual);
      done();
    });
  });

  it("should be able to concat with .concat and a string reference", done => {
    const expression = `
    const s1 = "Hello";
    const s2 = "World";
    const result = s1.concat(s2);
  `;
    evaluator(buildExpression(expression), actual => {
      assert(expression, actual);
      done();
    });
  });

  it("should be able to concat with .concat and an int", done => {
    const expression = `
    const s1 = "Hello";
    const result = s1.concat(50);
  `;
    evaluator(buildExpression(expression), actual => {
      assert(expression, actual);
      done();
    });
  });
});
