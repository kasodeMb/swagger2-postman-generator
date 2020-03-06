const fs = require("fs");
const uuidv4 = require("uuid").v4;

const Swagger2Postman = require("swagger2-postman2-parser");

const buildPostmanEnvironment = require("./buildPostmanEnvironment.js");

const ignoredVariables = ["scheme", "host", "port", "url"];

function validateSwaggerJson(jsonString) {
  const { result, reason } = Swagger2Postman.validate({
    type: "json",
    data: jsonString
  });
  if (!result) {
    throw new Error(`Swagger validation failed with reason: ${reason}`);
  }
}

/* swagger to postman conversions */
async function convertSwaggerSpecToPostmanCollection(swaggerSpec) {
  let response = new Promise((resolve, reject) => {
    validateSwaggerJson(swaggerSpec);
    Swagger2Postman.convert({ type: "json", data: swaggerSpec }, {}, function(
      error,
      result
    ) {
      if (error) {
        reject(error);
      }
      resolve(result);
    });
  });

  return response;
}

function addSomeTests(item, scripts) {
  scripts = scripts || [];
  item.event = scripts.map(value => {
    return {
      listen: value.listen,
      script: {
        id: uuidv4(),
        exec: typeof value.exec === "function" ? value.exec() : value.exec,
        type: "text/javascript"
      }
    };
  });
}

function handleAuthHeader(item, auth) {
  auth = auth || {};
  if (!auth.skip) {
    const value = auth.customValue || "{{bearerToken}}";
    item.request.auth = {
      type: "bearer",
      bearer: [{ key: "token", value, type: "string" }]
    };
  }
}

function getCurrentPathOptions(requestItem, options) {
  if (options.pathOptions) {
    const path = `/${requestItem.request.url.path.join("/")}`;
    const method = requestItem.request.method.toLowerCase();
    return options.pathOptions[path]
      ? options.pathOptions[path][method] || {}
      : {};
  }
  return {};
}

function parameterizeRequest(requestItem, options) {
  if (requestItem.request && requestItem.request.url) {
    const currentOptions = getCurrentPathOptions(requestItem, options);
    addSomeTests(requestItem, currentOptions.script);
    handleAuthHeader(requestItem, currentOptions.auth);
  }
}

async function convertSwaggerToPostman(swaggerSpec, options) {
  const { output } = await convertSwaggerSpecToPostmanCollection(swaggerSpec);
  const postmanCollection = output[0].data;

  // TODO: Make recursive
  postmanCollection.item.forEach(postmanItem => {
    if (postmanItem.request) {
      parameterizeRequest(postmanItem, options);
    } else {
      postmanItem.item.forEach(requestCollection => {
        if (requestCollection.request) {
          parameterizeRequest(requestCollection, options);
        } else if (requestCollection.item) {
          requestCollection.item.forEach(requestItem => {
            parameterizeRequest(requestItem, options);
          });
        }
      });
    }
  });
  return postmanCollection;
}

async function convertSwaggerToPostmanJson(swaggerSpec, options) {
  var postmanCollection = await convertSwaggerToPostman(swaggerSpec, options);

  if (options && options.prettyPrint) {
    return JSON.stringify(postmanCollection, null, 4);
  } else {
    return JSON.stringify(postmanCollection);
  }
}

/* swagger to postman environment conversions */
function buildEnvironmentVariable(
  name,
  value = "",
  type = "text",
  enabled = true
) {
  return {
    key: name,
    value: value,
    type: type,
    enabled: enabled
  };
}

async function convertSwaggerToPostmanEnvironment(swaggerSpec, options) {
  var postmanCollectionJson = await convertSwaggerToPostmanJson(
    swaggerSpec,
    options
  );
  const swaggerName = JSON.parse(postmanCollectionJson).info.name;
  var environment = buildPostmanEnvironment(swaggerName);

  var uniqueVariables = [
    ...new Set(postmanCollectionJson.match(/\{\{.+?\}\}/g))
  ];

  if (options && options.environment && options.environment.name) {
    environment.name = `${options.environment.name}`;
  }

  var environmentVariables = environment.values;
  var uniqueVariableDictionary = {};

  uniqueVariables.forEach(v => {
    var sanitisedVariableName = v.replace(/^{{|}}$/gm, "");
    uniqueVariableDictionary[sanitisedVariableName] = true;

    if (ignoredVariables.includes(sanitisedVariableName)) {
      return;
    }
    var environmentVariable = buildEnvironmentVariable(sanitisedVariableName);
    environmentVariables.push(environmentVariable);
  });

  if (
    !options ||
    !options.environment ||
    !options.environment.customVariables ||
    options.environment.customVariables.length < 1
  ) {
    return environment;
  }
  return environment;
}

async function convertSwaggerToPostmanEnvironmentJson(swaggerSpec, options) {
  var postmanEnvironment = await convertSwaggerToPostmanEnvironment(
    swaggerSpec,
    options
  );

  if (options && options.prettyPrint) {
    return JSON.stringify(postmanEnvironment, null, 4);
  } else {
    return JSON.stringify(postmanEnvironment);
  }
}

/* module function chain */
function convertSwagger(swaggerSpec) {
  return {
    toPostmanCollectionFile: async (postmanCollectionFilename, options) => {
      options = options || {};
      if (options.debug) {
        console.log(`Saving Postman Collection to file...`);
      }

      var postmanCollectionJson = await convertSwaggerToPostmanJson(
        swaggerSpec,
        options
      );

      fs.writeFileSync(postmanCollectionFilename, postmanCollectionJson);

      if (options.debug) {
        console.log(
          `Saved Postman Collection to file ${postmanCollectionFilename}`
        );
      }
    },
    toPostmanEnvironmentFile: async (postmanEnvironmentFilename, options) => {
      options = options || {};
      if (options.debug) {
        console.log(`Saving Postman Collection to file...`);
      }

      var postmanCollectionJson = await convertSwaggerToPostmanEnvironmentJson(
        swaggerSpec,
        options
      );

      fs.writeFileSync(postmanEnvironmentFilename, postmanCollectionJson);

      if (options.debug) {
        console.log(
          `Saved Postman Collection to file ${postmanEnvironmentFilename}`
        );
      }
    }
  };
}

/* module export */
module.exports = {
  convertSwagger: () => ({
    fromSpec: (swaggerSpec, options) => convertSwagger(swaggerSpec, options)
  })
};
