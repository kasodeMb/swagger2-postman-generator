/* module export */
module.exports = {
  "/user/login": {
    post: {
      auth: {
        skip: true
      },
      script: [
        {
          listen: "test",
          exec: ["pm.environment.set('userToken', body.token)"]
        }
      ]
    }
  }
};
