// These functions setup circular associations separately from the model files to resolve
// circular dependencies between Sequelize models like, for example, AsServedImage and AsServedSet,
// which previously referenced each other directly via decorators

export default () => {};
