import "mocha";
import { assertArrayResult } from "../../utils/assert";
import { evaluator } from "../../utils/evaluator";
import { expect, use } from "chai";

describe("Array Methods", () => {
  describe("push", () => {
    it("should add one element to the array and return its length", done => {
      const expression = `
			let array = [];
			array.push(10);
			const result = array.push(2);
			`;
      assertArrayResult(expression, done);
    });

    it("should increase array length by 1", done => {
      const expression = `
			let array = [];
			array.push(10);
			const result = array.length;
			`;
      assertArrayResult(expression, done);
    });
  });

  describe("shift", () => {
    it("should remove one element from the array", done => {
      const expression = `
			let array = [1, 2, 3];
			array.shift();
			const result = array.length;
			`;
      assertArrayResult(expression, done);
    });

    it("should return the first element from the array", done => {
      const expression = `
			let array = [1, 2, 3];
			const result = array.shift();
			`;
      assertArrayResult(expression, done);
    });
  });

  describe("unshift", () => {
    it("should add one element to the array", done => {
      const expression = `
			let array = [1, 2, 3];
			array.unshift(0);
			const result = array.length;
			`;
      assertArrayResult(expression, done);
    });

    it("should return the new length of the array", done => {
      const expression = `
			let array = [1, 2, 3];
			const result = array.unshift(0);
			`;
      assertArrayResult(expression, done);
    });
  });

  describe("pop", () => {
    it("should decrease array length by 1", done => {
      const expression = `
			let array = [1, 2, 3];
			array.pop();
			const result = array.length;
			`;
      assertArrayResult(expression, done);
    });

    it("should return the last element of the array", done => {
      const expression = `
			let array = [1, 2, 3];
			const result = array.pop();
			`;
      assertArrayResult(expression, done);
    });
  });

  describe("indexOf", () => {
    it("should return 0 for the for the first element", done => {
      const expression = `
			let array = [1, 2, 3];
			const result = array.indexOf(1);
			`;
      assertArrayResult(expression, done);
    });

    it("should return 1 for the for the second element", done => {
      const expression = `
			let array = [1, 2, 3];
			const result = array.indexOf(2);
			`;
      assertArrayResult(expression, done);
    });

    it("should return 2 for the for the third element", done => {
      const expression = `
			let array = [1, 2, 3];
			const result = array.indexOf(3);
			`;
      assertArrayResult(expression, done);
    });

    it("should find elements added later", done => {
      const expression = `
			let array = [1, 2, 3];
			array.push(4);
			const result = array.indexOf(4);
			`;
      assertArrayResult(expression, done);
    });

    it("should not find removed elements", done => {
      const expression = `
			let array = [1, 2, 3];
			array.pop();
			const result = array.indexOf(3);
			`;
      assertArrayResult(expression, done);
    });

    it("should return -1 when element not found", done => {
      const expression = `
			let array = [1, 2, 3];
			const result = array.indexOf(4);
			`;
      assertArrayResult(expression, done);
    });
  });
});
