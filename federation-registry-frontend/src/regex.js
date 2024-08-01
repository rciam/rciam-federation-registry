/* eslint-disable */
const reg = {
  regUrl:/^https:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#/=]{1,256}\.?[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/,
  regLocalhostUrl:/^https?:\/\/(localhost)(\.\w+)*(:[0-9]+)?\/?(\/[.\w]*)*$/,
  regSimpleUrl:/^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/,
  regScope:/1*[\x21\x23-\x5B\x5D-\x7E]/,
  regCodeChalMeth:/^plain$|^S256$/,
  regClientId:/^[0-9a-zA-Z\$\-_\.\+!\*'\(\),]+$/,
  regIpv6Local:/^(::1|fe80::(?:[0-9a-fA-F]{1,4})(?::[0-9a-fA-F]{1,4}){0,6}|fc[0-9a-fA-F]{2}::(?:[0-9a-fA-F]{1,4})(?::[0-9a-fA-F]{1,4}){0,6})$/,
  regIpv4Local:/^(10\.(?:[0-9]{1,3}\.){2}[0-9]{1,3}|172\.(?:1[6-9]|2[0-9]|3[0-1])\.(?:[0-9]{1,3}\.)[0-9]{1,3}|192\.168\.(?:[0-9]{1,3}\.)[0-9]{1,3})$/,
}
module.exports = {
  reg
}
