module.exports = api => {
    // Jest sets the `api.cache` value to `false` when running tests
    const isTest = api.cache(() => process.env.NODE_ENV === 'test');
  
    return {
      presets: [
        [
          "@babel/preset-env",
          {
            targets: {
              node: "current" // This specifies that Babel should transpile the code for the current version of Node.js
            },
            modules: isTest ? 'commonjs' : false // Use 'commonjs' modules for tests
          }
        ]
      ]
    };
  };