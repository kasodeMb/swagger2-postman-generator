#!/usr/bin/env node
const argv = require("yargs").argv;
const fs = require("fs");
const Swagger2Postman = require("../swagger2-postman2-generator");
const YAML = require("yamljs");

let pathOptions = {};
let outputPath = "";
let swaggerPath = "";

if (argv.swagger) {
  swaggerPath = argv.swagger;
} else {
  throw "Missing 'swagger' argument";
}

if (argv.postmanConfig) {
  console.log("path", `${process.cwd()}/${argv.postmanConfig}`);
  pathOptions = require(`${process.cwd()}/${argv.postmanConfig}`);
  console.log(pathOptions);
}

if (argv.outputPath) {
  outputPath = argv.outputPath;
} else {
  throw "Missing 'outputPath' argument";
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
  { pathOptions }
);
