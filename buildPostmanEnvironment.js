const uuidv4 = require("uuid").v4;

module.exports = function(name) {
  const environmentTemplate = {
    id: uuidv4(),
    name,
    values: [],
    timestamp: Date.now(),
    _postman_variable_scope: "environment",
    _postman_exported_at: new Date().toISOString(),
    _postman_exported_using: "Postman/5.3.2"
  };
  return JSON.parse(JSON.stringify(environmentTemplate));
};
