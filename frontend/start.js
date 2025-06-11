const detect = require('detect-port').default || require('detect-port');
const { exec } = require('child_process');

const DEFAULT_PORT = 3000;

detect(DEFAULT_PORT).then((port) => {
  if (port === DEFAULT_PORT) {
    exec('react-scripts start', { stdio: 'inherit' });
  } else {
    console.log(
      `Port ${DEFAULT_PORT} is in use, starting on port ${port} instead.`
    );
    exec(`set PORT=${port} && react-scripts start`, { stdio: 'inherit' });
  }
});
