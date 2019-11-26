const reg = {
  regUrl:/^https:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
  regSimpleUrl:/^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/,
  regScope:/^[a-z_]*$/,
  regCodeChalMeth:/^plain$|^S256$/,
  regEmail:/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
}
module.exports = {
  reg
}
