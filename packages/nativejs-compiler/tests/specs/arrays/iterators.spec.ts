import "mocha";
import { assertStringResult } from "../../utils/assert";
import { evaluator } from "../../utils/evaluator";
import { expect, use } from "chai";

describe("Array Iterators", () => {
  describe("forEach", () => {
    it("should summ all elements in an Array", done => {
      const expression = `
        const array = [5, 10, 15, 20];
        let result = 0;
        array.forEach(item => {
          result += item;
        });
      `;
      assertStringResult(expression, done);
    });
  });
});
