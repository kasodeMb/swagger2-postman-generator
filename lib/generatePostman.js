#!/usr/bin/env node
const argv = require("yargs").argv;
const fs = require("fs");
const path = require("path");
const Swagger2Postman = require("../swagger2-postman2-generator");
const YAML = require("yamljs");

let pathOptions = {};
let outputPath = "";
let swaggerPath = "";
let envVariables = [];
const ENV_PREFIX = "POSTMAN_";

const loadDotEnvFile = loadDotEnvFile => {
  try {
    const dotEnvFilePath = path.resolve(process.cwd(), loadDotEnvFile);
    if (fs.existsSync(dotEnvFilePath)) {
      require("dotenv").config({
        path: dotEnvFilePath
      });

      return true;
    }
  } catch (err) {
    console.error(err);
  }

  return false;
};

if (argv.swagger) {
  swaggerPath = argv.swagger;
} else {
  throw "Missing 'swagger' argument";
}

if (argv.postmanConfig) {
  pathOptions = require(`${process.cwd()}/${argv.postmanConfig}`);
}

if (argv.outputPath) {
  outputPath = argv.outputPath;
} else {
  throw "Missing 'outputPath' argument";
}

if (argv.envPath) {
  envPath = loadDotEnvFile(argv.envPath);
  const keys = Object.keys(process.env);
  envVariables = keys
    .filter(key => key.startsWith(ENV_PREFIX))
    .map(key => {
      return { key: key.replace(ENV_PREFIX, ""), value: process.env[key] };
    });
}

fs.mkdir(outputPath, { recursive: true }, err => {
  if (err) throw err;
});

// Load yaml file using YAML.load
nativeObject = YAML.load(swaggerPath);
const s2p = Swagger2Postman.convertSwagger().fromSpec(nativeObject);
s2p.toPostmanCollectionFile(
  `${outputPath}/${nativeObject.info.title}-collection.json`,
  { pathOptions }
);
s2p.toPostmanEnvironmentFile(
  `${outputPath}/${nativeObject.info.title}-environment.json`,
  { pathOptions, envVariables }
);
