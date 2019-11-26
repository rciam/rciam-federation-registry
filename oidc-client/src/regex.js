const reg = {
  /* eslint-disable-next-line */
  regUrl:/^https:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
  regSimpleUrl:/^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/,
  regScope:/^[a-z_]*$/,
  regCodeChalMeth:/^plain$|^S256$/,
}
module.exports = {
  reg
}
