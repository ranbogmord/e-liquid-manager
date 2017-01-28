if (!window.IOConnection) {
  window.IOConnection = io.connect();
}

module.exports = window.IOConnection;
