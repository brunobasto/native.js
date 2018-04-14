import "mocha";
import { expect } from "chai";
import { evaluator } from "../../utils/evaluator";

const logResult = (expression, result = "result") => `
  ${expression}
  console.log(${result});
`;
const assertExpression = (expression, actual, expected = undefined) => {
  if (!expected) {
    expected = eval(`${expression};result`);
  }
  expect(actual).to.equal(`${expected}\n`);
};

describe("Numbers Expression Evaluator", () => {
  it("should be able to add two literal integers", done => {
    const expression = `
      const result = 3 + 4;
    `;
    evaluator(logResult(expression), actual => {
      assertExpression(expression, actual);
      done();
    });
  });

  it("should be able to add two integers", done => {
    const expression = `
      const a = 3;
      const b = 4;
      const result = a + b;
    `;
    evaluator(logResult(expression), actual => {
      assertExpression(expression, actual);
      done();
    });
  });

  it("should be able to subtract two integers", done => {
    const expression = `
      const a = 3;
      const b = 4;
      const result = a - b;
    `;
    evaluator(logResult(expression), actual => {
      assertExpression(expression, actual);
      done();
    });
  });

  it("should be able to multiply two integers", done => {
    const expression = `
      const a = 3;
      const b = 4;
      const result = a * b;
    `;
    evaluator(logResult(expression), actual => {
      assertExpression(expression, actual);
      done();
    });
  });

  it("should be able to divide two integers", done => {
    const expression = `
      const a = 3;
      const b = 4;
      const result = a / b;
    `;
    evaluator(logResult(expression), actual => {
      // we need to override expected float numbers since
      // printf outputs trailing zeros
      assertExpression(expression, actual, "0.750000");
      done();
    });
  });

  it("should be able to divide two literal integers", done => {
    const expression = `
      const result = 3 / 4;
    `;
    evaluator(logResult(expression), actual => {
      assertExpression(expression, actual, "0.750000");
      done();
    });
  });

  it("should be able to add two floats", done => {
    const expression = `
      const a = 45.97;
      const b = 4.32;
      const result = a + b;
    `;
    evaluator(logResult(expression), actual => {
      // close enough?
      assertExpression(expression, actual, "50.290001");
      done();
    });
  });

  it("should be able to subtract two floats", done => {
    const expression = `
      const a = 3.9;
      const b = 4.3;
      const result = a - b;
    `;
    evaluator(logResult(expression), actual => {
      // close enough?
      assertExpression(expression, actual, "-0.400000");
      done();
    });
  });
});
