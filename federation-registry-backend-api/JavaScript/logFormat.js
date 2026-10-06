const winston = require('winston');

// JSON log format that keeps every log entry strictly on one line
function baseReplacer(key, value) {
  if (value instanceof Buffer)
    return value.toString('base64');
  if (typeof value === 'bigint')
    return value.toString();
  return value;
}

const oneLineJson = winston.format.json({
  replacer: (key, value) => {
    value = baseReplacer(key, value);
    return typeof value === 'string' ? value.replace(/\r?\n/g, ' | ') : value;
  }
});

module.exports = { oneLineJson };
