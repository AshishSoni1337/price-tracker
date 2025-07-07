import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// This is based on the Create React App script.
// https://github.com/facebook/create-react-app/blob/main/packages/react-scripts/config/env.js

const backendDirectory = path.resolve(process.cwd());
const dotenvPath = path.resolve(backendDirectory, ".env");

const { NODE_ENV } = process.env;
if (!NODE_ENV) {
    throw new Error(
        "The NODE_ENV environment variable is required but was not specified."
    );
}

// The order of files is important. Files on top have less priority.
// A variable defined in a file will not be overridden by a subsequent file.
const dotenvFiles = [
    `${dotenvPath}.${NODE_ENV}.local`,
    `${dotenvPath}.${NODE_ENV}`,
    // Don't include `.env.local` for `test` environment
    // since normally you expect tests to produce the same
    // results for everyone
    NODE_ENV !== "test" && `${dotenvPath}.local`,
    dotenvPath,
].filter(Boolean);

// Load environment variables from .env* files.
// We reverse the array so that the files with the highest priority are loaded first.
// dotenv does not override any environment variables that have already been set.
// https://github.com/motdotla/dotenv
dotenvFiles.reverse().forEach((dotenvFile) => {
    if (fs.existsSync(dotenvFile)) {
        dotenv.config({
            path: dotenvFile,
        });
    }
});
