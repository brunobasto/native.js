import * as ts from "typescript";
import { IScope } from "../core/program";
import { INativeExpression } from "../nodes/expressions";

const plugins: Plugin[] = [];

export class PluginRegistry {
  public static executePlugins(
    scope: IScope,
    node: ts.Node,
    handler: Object
  ): INativeExpression {
    const matchingPlugins = plugins.filter(p => p.matchesNode(node));

    if (matchingPlugins.length === 0) {
      return null;
    }

    return matchingPlugins[matchingPlugins.length - 1].execute(
      scope,
      node,
      handler
    );
  }

  public static matchesNode(node: ts.Node): boolean {
    for (const plugin of plugins) {
      if (plugin.matchesNode(node)) {
        return true;
      }
    }
    return false;
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
  execute(scope: IScope, node: ts.Node, handler: Object): INativeExpression;
  matchesNode(node: ts.Node): boolean;
  processTypes(node: ts.Node);
}
