var firstNames = require('./corpora/firstNames.json').firstNames
var lastNames = require('./corpora/lastNames.json').lastNames

var uidToDelegate = {
  a: 'c',
  b: 'd',
  c: 'a',
  d: 'b',
  e: 'a',
  f: 'a',
  g: 'a',
  h: 'a',
  z: 'g',
}

module.exports = Object.keys(uidToDelegate).map(function (uid) {
  var randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  var randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)]

  return {
    uid: uid,
    full_name: randomFirstName + ' ' + randomLastName,
    delegate: uidToDelegate[uid],
  }
})
