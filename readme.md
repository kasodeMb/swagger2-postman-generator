# swagger2-postman2-generator

A simple interface for converting Swagger v2 JSON Specs to a Postman Collection, with samples of Swagger YAML files.

Based on the [swagger2-to-postman](https://github.com/postmanlabs/swagger2-to-postman) NPM package and [Swagger UI](https://github.com/swagger-api/swagger-ui) JSON example request generator.

Features:

- Import Swagger Spec direct YAML file

- Export Postman Collection to JSON file

- Export Postman Environment with all URL parameters and other variables to JSON file

---

## Usage

```
node ./lib/generatePostman.js --outputPath=output --swagger=example/swagger.yaml --postmanConfig=example/postman-scripts.js
```
