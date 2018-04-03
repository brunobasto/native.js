import * as ts from "typescript";
import { CExpression } from "../nodes/expressions";
import { IScope } from "../program";

const plugins: Plugin[] = [];

export class PluginRegistry {
  public static executePlugins(
    scope: IScope,
    node: ts.Node,
    handler: Object
  ): CExpression {
    const matchingPlugins = plugins.filter(p => p.matchesNode(node));

    if (matchingPlugins.length == 0) {
      return null;
    }

    return matchingPlugins[matchingPlugins.length - 1].execute(
      scope,
      node,
      handler
    );
  }

  public static processTypesForNode(node: ts.Node) {
    for (const plugin of plugins) {
      if (plugin.matchesNode(node)) {
        plugin.processTypes(node);
      }
    }
  }

  public static registerPlugin(plugin: Plugin) {
    plugins.push(plugin);
  }
}

export interface Plugin {
  execute(scope: IScope, node: ts.Node, handler: Object): CExpression;
  matchesNode(node: ts.Node): boolean;
  processTypes(node: ts.Node);
}
