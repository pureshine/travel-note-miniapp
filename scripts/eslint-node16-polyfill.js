if (typeof global.structuredClone !== "function") {
  const { deserialize, serialize } = require("v8");
  global.structuredClone = (value) => deserialize(serialize(value));
}

if (
  typeof global.AbortSignal !== "undefined" &&
  typeof global.AbortSignal.prototype.throwIfAborted !== "function"
) {
  global.AbortSignal.prototype.throwIfAborted = function throwIfAborted() {
    if (!this.aborted) return;
    throw this.reason || new Error("The operation was aborted");
  };
}
