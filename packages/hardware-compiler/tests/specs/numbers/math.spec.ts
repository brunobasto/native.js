import "mocha";
import { assert, buildExpression } from "../../utils/assert";
import { evaluator } from "../../utils/evaluator";
import { expect, use } from "chai";

describe("Numbers Expression Evaluator", () => {
  describe("Add", () => {
    it("should be able to add two literal integers", done => {
      const expression = `
        const result = 3 + 4;
      `;
      evaluator(buildExpression(expression), actual => {
        assert(expression, actual);
        done();
      });
    });

    it("should be able to add two integer variables", done => {
      const expression = `
        const a = 3;
        const b = 4;
        const result = a + b;
      `;
      evaluator(buildExpression(expression), actual => {
        assert(expression, actual);
        done();
      });
    });

    it("should be able to add two float variables", done => {
      const expression = `
        const a = 45.97;
        const b = 4.32;
        const result = a + b;
      `;
      evaluator(buildExpression(expression), actual => {
        // close enough?
        assert(expression, actual, "50.290001");
        done();
      });
    });

    it("should be able to add two literal floats", done => {
      const expression = `
        const result = 45.97 + 4.32;
      `;
      evaluator(buildExpression(expression), actual => {
        // close enough?
        assert(expression, actual, '50.290001');
        done();
      });
    });
  });

  describe("Subtract", () => {
    it("should be able to subtract two integer variables", done => {
      const expression = `
        const a = 3;
        const b = 4;
        const result = a - b;
      `;
      evaluator(buildExpression(expression), actual => {
        assert(expression, actual);
        done();
      });
    });

    it("should be able to subtract two float variables", done => {
      const expression = `
        const a = 3.9;
        const b = 4.3;
        const result = a - b;
      `;
      evaluator(buildExpression(expression), actual => {
        // close enough?
        assert(expression, actual, "-0.400000");
        done();
      });
    });
  });

  describe("Divide", () => {
    it("should be able to divide two integers", done => {
      const expression = `
        const a = 3;
        const b = 4;
        const result = a / b;
      `;
      evaluator(buildExpression(expression), actual => {
        // we need to override expected float numbers since
        // printf outputs trailing zeros
        assert(expression, actual, "0.750000");
        done();
      });
    });

    it("should be able to divide two literal integers", done => {
      const expression = `
        const result = 3 / 4;
      `;
      evaluator(buildExpression(expression), actual => {
        assert(expression, actual, "0.750000");
        done();
      });
    });
  });

  describe("Multiply", () => {
    it("should be able to multiply two integer variables", done => {
      const expression = `
        const a = 3;
        const b = 4;
        const result = a * b;
      `;
      evaluator(buildExpression(expression), actual => {
        assert(expression, actual);
        done();
      });
    });
  });
});
