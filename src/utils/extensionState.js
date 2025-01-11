let extensionContext = null;

function setExtensionContext(context) {
  extensionContext = context;
}

function getExtensionContext() {
  return extensionContext;
}

module.exports = {
  setExtensionContext,
  getExtensionContext
}; 