declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_EXPIRES_IN: string;
      JWT_SECRET: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
