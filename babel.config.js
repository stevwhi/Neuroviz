module.exports = api => {
   
    const isTest = api.cache(() => process.env.NODE_ENV === 'test');
  
    return {
      presets: [
        [
          "@babel/preset-env",
          {
            targets: {
              node: "current" 
            },
            modules: isTest ? 'commonjs' : false 
          }
        ]
      ]
    };
  };