import "mocha";
import { assertStringResult } from "../../utils/assert";
import { evaluator } from "../../utils/evaluator";
import { expect, use } from "chai";

describe("Functions", () => {
  it("should allow declaring named functions with integer return type", done => {
    const expression = `
      function myFunction() {
        return 10;
      }
      const result = myFunction();
    `;
    assertStringResult(expression, done);
  });

  xit("should allow IIFEs", done => {
    const expression = `
      const result = (function () {
        return "Barry";
      })();
    `;
    assertStringResult(expression, done);
  });

  xit("should allow arguments", done => {
    const expression = `
      function returnArguments() {
        return arguments;
      }
      const result = returnArguments(1, 2, 3);
    `;
    assertStringResult(expression, done);
  });

  xit("should allow declaring named functions with parameter and integer return type", done => {
    const expression = `
      function myFunction(add) {
        return 10 + add;
      }
      const result = myFunction(5);
    `;
    assertStringResult(expression, done);
  });

  xit("should allow declaring function variables with integer return type", done => {
    const expression = `
      const myFunction = function() {
        return 10;
      }
      const result = myFunction();
    `;
    assertStringResult(expression, done);
  });

  xit("should allow declaring arrow function variables with integer return type", done => {
    const expression = `
      const myFunction = () => {
        return 10;
      }
      const result = myFunction();
    `;
    assertStringResult(expression, done);
  });
});
