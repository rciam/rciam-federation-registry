/* eslint-disable */
const reg = {
  regUrl:/^https:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#/=]{1,256}\.?[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/,
  regLocalhostUrl:/^https?:\/\/(localhost)(\.\w+)*(:[0-9]+)?\/?(\/[.\w]*)*$/,
  regSimpleUrl:/^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/,
  regScope:/1*[\x21\x23-\x5B\x5D-\x7E]/,
  regCodeChalMeth:/^plain$|^S256$/,
  regClientId:/^[0-9a-zA-Z\$\-_\.\+!\*'\(\),]+$/
}
module.exports = {
  reg
}
