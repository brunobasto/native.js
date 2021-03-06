import { IScope } from "./program";

interface INode {
  kind: number;
  getText(): string;
}

const nodeKindTemplates: {
  [kind: string]: { new (scope: IScope, node: INode): any };
} = {};

export class CodeTemplateFactory {
  public static createForNode(scope: IScope, node: INode) {
    return (
      (nodeKindTemplates[node.kind] &&
        new nodeKindTemplates[node.kind](scope, node)) ||
      "/* Unsupported node: " +
        node.getText().replace(/[\n\s]+/g, " ") +
        " */;\n"
    );
  }
}

export function CodeTemplate(tempString: string, nodeKind?: number | number[]) {
  return function(target: Function): any {
    const newConstructor = function(scope: IScope, ...rest: any[]): any {
      const self = this;
      const makeTarget = () => {
        const newTarget = target as any;
        return new newTarget(...arguments);
      };
      const retValue = makeTarget();
      const [code, statements] = processTemplate(tempString, retValue);
      if (statements) {
        scope.statements.push(statements);
      }
      retValue.resolve = function() {
        return code;
      };
      return retValue;
    };

    if (nodeKind) {
      if (typeof nodeKind === "number") {
        nodeKindTemplates[nodeKind] = newConstructor as any;
      } else {
        for (const nk of nodeKind) {
          nodeKindTemplates[nk] = newConstructor as any;
        }
      }
    }
    return newConstructor;
  };
}

/** Returns: [code, statements] */
function processTemplate(template: string, context: any): [string, string] {
  let statements = "";
  if (template.indexOf("{#statements}") > -1) {
    let statementsStartPos = template.indexOf("{#statements}");
    const statementsBodyStartPos = statementsStartPos + "{#statements}".length;
    let statementsBodyEndPos = template.indexOf("{/statements}");
    const statementsEndPos = statementsBodyEndPos + "{/statements}".length;
    while (
      statementsStartPos > 0 &&
      (template[statementsStartPos - 1] === " " ||
        template[statementsStartPos - 1] === "\n")
    ) {
      statementsStartPos--;
    }
    if (
      statementsBodyEndPos > 0 &&
      template[statementsBodyEndPos - 1] === "\n"
    ) {
      statementsBodyEndPos--;
    }
    const templateText = template
      .slice(statementsBodyStartPos, statementsBodyEndPos)
      .replace(/\n    /g, "\n");
    const [c, s] = processTemplate(templateText, context);
    statements += s + c;
    template =
      template.slice(0, statementsStartPos) + template.slice(statementsEndPos);
  }

  if (typeof context === "string") {
    return [template.replace(/{this}/g, () => context), statements];
  }

  let ifPos;
  while ((ifPos = template.indexOf("{#if ")) > -1) {
    let posBeforeIf = ifPos;
    while (
      posBeforeIf > 0 &&
      (template[posBeforeIf - 1] === " " || template[posBeforeIf - 1] === "\n")
    ) {
      posBeforeIf--;
    }
    ifPos += 5;
    const conditionStartPos = ifPos;
    while (template[ifPos] != "}") {
      ifPos++;
    }

    let endIfPos = template.indexOf("{/if}", ifPos);
    const elseIfPos = template.indexOf("{#elseif ", ifPos);
    const elsePos = template.indexOf("{#else}", ifPos);
    let endIfBodyPos = endIfPos;
    if (elseIfPos != -1 && elseIfPos < endIfBodyPos) {
      endIfBodyPos = elseIfPos;
    }
    if (elsePos != -1 && elsePos < endIfBodyPos) {
      endIfBodyPos = elsePos;
    }
    if (endIfBodyPos > 0 && template[endIfBodyPos - 1] === "\n") {
      endIfBodyPos--;
    }

    const posAfterIf = endIfPos + 5;
    if (endIfPos > 0 && template[endIfPos - 1] === "\n") {
      endIfPos--;
    }

    let evalText = template.slice(conditionStartPos, ifPos);
    for (const k in context) {
      evalText = evalText.replace(new RegExp("\\b" + k + "\\b", "g"), function(
        m
      ) {
        return "context." + m;
      });
    }
    const evalResult: boolean = eval(evalText);
    if (evalResult) {
      template =
        template.slice(0, posBeforeIf) +
        template.slice(ifPos + 1, endIfBodyPos).replace(/\n    /g, "\n") +
        template.slice(posAfterIf);
    } else if (elseIfPos > -1) {
      template =
        template.slice(0, posBeforeIf) + "{#" + template.slice(elseIfPos + 6);
    } else if (elsePos > -1) {
      template =
        template.slice(0, posBeforeIf) +
        template.slice(elsePos + 7, endIfPos).replace(/\n    /g, "\n") +
        template.slice(posAfterIf);
    } else {
      template = template.slice(0, posBeforeIf) + template.slice(posAfterIf);
    }
  }

  let replaced = false;
  for (const k in context) {
    if (k === "resolve") {
      continue;
    }
    if (context[k] && context[k].push) {
      const data = { template };
      while (replaceArray(data, k, context[k], statements)) {
        replaced = true;
      }
      template = data.template;
    } else {
      let index = -1;
      while ((index = template.indexOf("{" + k + "}")) > -1) {
        let spaces = "";
        while (template.length > index && template[index - 1] === " ") {
          index--;
          spaces += " ";
        }
        let value = context[k];
        if (value && value.resolve) {
          value = value.resolve();
        }
        if (value && typeof value === "string") {
          value = value.replace(/\n/g, "\n" + spaces);
        }
        template = template.replace("{" + k + "}", () => value);
        replaced = true;
      }
    }
  }
  if (context.resolve && !replaced && template.indexOf("{this}") > -1) {
    template = template.replace("{this}", () => context.resolve());
  }
  template = template
    .replace(/^[\n]*/, "")
    .replace(/\n\s*\n[\n\s]*\n/g, "\n\n");
  return [template, statements];
}

function replaceArray(data, k, array, statements) {
  let pos = data.template.indexOf("{" + k + "}");
  if (pos != -1) {
    let elementsResolved = "";
    for (const element of array) {
      const [resolvedElement, elementStatements] = processTemplate(
        "{this}",
        element
      );
      statements += elementStatements;
      elementsResolved += resolvedElement;
    }

    data.template =
      data.template.slice(0, pos) +
      elementsResolved +
      data.template.slice(pos + k.length + 2);
    return true;
  }
  if (pos === -1) {
    pos = data.template.indexOf("{" + k + " ");
  }
  if (pos === -1) {
    pos = data.template.indexOf("{" + k + "=");
  }
  if (pos === -1) {
    pos = data.template.indexOf("{" + k + "{");
  }
  if (pos === -1) {
    return false;
  }
  let startPos = pos;
  pos += k.length + 1;
  while (data.template[pos] === " ") {
    pos++;
  }
  let separator = "";

  if (data.template[pos] === "{") {
    pos++;
    while (data.template[pos] != "}" && pos < data.template.length) {
      separator += data.template[pos];
      pos++;
    }
    pos++;
  }
  if (
    pos >= data.template.length - 2 ||
    data.template[pos] !== "=" ||
    data.template[pos + 1] !== ">"
  ) {
    throw new Error(
      "Internal error: incorrect template format for array " + k + "."
    );
  }

  pos += 2;
  if (data.template[pos] === " " && data.template[pos + 1] != " ") {
    pos++;
  }

  let curlyBracketCounter = 1;
  const elementTemplateStart = pos;
  while (curlyBracketCounter > 0) {
    if (pos === data.template.length) {
      throw new Error(
        "Internal error: incorrect template format for array " + k + "."
      );
    }
    if (data.template[pos] === "{") {
      curlyBracketCounter++;
    }
    if (data.template[pos] === "}") {
      curlyBracketCounter--;
    }
    pos++;
  }
  const elementTemplate = data.template.slice(elementTemplateStart, pos - 1);
  let elementsResolved = "";

  for (const element of array) {
    let [resolvedElement, elementStatements] = processTemplate(
      elementTemplate,
      element
    );
    statements += elementStatements;

    if (k === "statements") {
      resolvedElement = resolvedElement.replace(/[;\n]+;/g, ";");
      if (resolvedElement.search(/\n/) > -1) {
        for (const line of resolvedElement.split("\n")) {
          if (line != "") {
            if (elementsResolved != "") {
              elementsResolved += separator;
            }
            elementsResolved += line + "\n";
          }
        }
      } else {
        if (elementsResolved != "" && resolvedElement != "") {
          elementsResolved += separator;
        }
        if (resolvedElement.search(/^[\n\s]*$/) === -1) {
          elementsResolved += resolvedElement + "\n";
        }
      }
    } else {
      if (elementsResolved != "") {
        elementsResolved += separator;
      }
      elementsResolved += resolvedElement;
    }
  }

  if (array.length === 0) {
    while (pos < data.template.length && data.template[pos] === " ") {
      pos++;
    }
    while (pos < data.template.length && data.template[pos] === "\n") {
      pos++;
    }
    while (startPos > 0 && data.template[startPos - 1] === " ") {
      startPos--;
    }
    while (startPos > 0 && data.template[startPos - 1] === "\n") {
      startPos--;
    }
    if (data.template[startPos] === "\n") {
      startPos++;
    }
  }
  data.template =
    data.template.slice(0, startPos) +
    elementsResolved +
    data.template.slice(pos);
  return true;
}
