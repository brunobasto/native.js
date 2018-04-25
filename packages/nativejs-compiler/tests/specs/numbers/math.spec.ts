import { expect, use } from "chai";
import "mocha";
import { assertStringResult } from "../../utils/assert";
import { evaluator } from "../../utils/evaluator";

describe("Numbers Expression Evaluator", () => {
  describe("Add", () => {
    it("should be able to add two literal integers", done => {
      const expression = `
        const result = 3 + 4;
      `;
      assertStringResult(expression, done);
    });

    it("should be able to add two integer variables", done => {
      const expression = `
        const a = 3;
        const b = 4;
        const result = a + b;
      `;
      assertStringResult(expression, done);
    });

    it("should be able to add two float variables", done => {
      const expression = `
        const a = 45.97;
        const b = 4.32;
        const result = a + b;
      `;
      assertStringResult(expression, done, "50.290001");
    });

    it("should be able to add two literal floats", done => {
      const expression = `
        const result = 45.97 + 4.32;
      `;
      assertStringResult(expression, done, "50.290001");
    });
  });

  describe("Subtract", () => {
    it("should be able to subtract two integer variables", done => {
      const expression = `
        const a = 3;
        const b = 4;
        const result = a - b;
      `;
      assertStringResult(expression, done);
    });

    it("should be able to subtract two float variables", done => {
      const expression = `
        const a = 3.9;
        const b = 4.3;
        const result = a - b;
      `;
      assertStringResult(expression, done, "-0.400000");
    });
  });

  describe("Divide", () => {
    it("should be able to divide two integers", done => {
      const expression = `
        const a = 3;
        const b = 4;
        const result = a / b;
      `;
      assertStringResult(expression, done, "0.750000");
    });

    it("should be able to divide two literal integers", done => {
      const expression = `
        const result = 3 / 4;
      `;
      assertStringResult(expression, done, "0.750000");
    });
  });

  describe("Multiply", () => {
    it("should be able to multiply two integer variables", done => {
      const expression = `
        const a = 3;
        const b = 4;
        const result = a * b;
      `;
      assertStringResult(expression, done);
    });
  });
});
