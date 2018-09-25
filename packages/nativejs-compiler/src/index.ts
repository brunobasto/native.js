import { CProgram } from "./core/program";

export default CProgram;

export * from "./core/bottom";
export * from "./core/header";
export * from "./core/main";
export * from "./core/PluginRegistry";
export * from "./core/preset";
export * from "./core/program";
export * from "./core/resolver";
export * from "./core/template";

export * from "./core/types/NativeTypes";
export * from "./core/types/PropertiesDictionary";
export * from "./core/types/Structures";
export * from "./core/types/TypeVisitor";
export * from "./core/types/TypeInferencer";
export * from "./core/types/TypeRegistry";

export * from "./nodes/assignment";
export * from "./nodes/call";
export * from "./nodes/elementaccess";
export * from "./nodes/expressions";
export * from "./nodes/function";
export * from "./nodes/literals";
export * from "./nodes/statements";
export * from "./nodes/variable";
