const isBrowser = typeof window !== "undefined";

const logger = {
  info: (...args: unknown[]) => {
    if (isBrowser) {
      console.log("[INFO]", ...args);
    } else {
      console.log("[INFO]", ...args);
    }
  },
  error: (...args: unknown[]) => {
    if (isBrowser) {
      console.error("[ERROR]", ...args);
    } else {
      console.error("[ERROR]", ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isBrowser) {
      console.warn("[WARN]", ...args);
    } else {
      console.warn("[WARN]", ...args);
    }
  },
};

export default logger;