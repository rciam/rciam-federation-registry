const findConnections = (req, res, db) => {
  db.select('*').from('connections')
    .then(items => {
      if(items.length){
        res.json(items)
      } else {
        res.json({dataExists: 'false'})
      }
    })
    .catch(err => res.status(400).json({dbError: 'db error'}))
}
module.exports = {
  findConnections
}
