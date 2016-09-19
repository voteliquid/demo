var firstNames = require('./corpora/firstNames.json').firstNames
var lastNames = require('./corpora/lastNames.json').lastNames
var _ = require('lodash')

// Don't use any of these as UIDs:
  // missing firstName starting letters: q, u, y
  // missing lastName starting letters: i, q, u, x, z

var uidToDelegate = {
  a: 'c',
  b: 'd',
  c: 'a',
  d: 'b',
  e: 'a',
  f: 'a',
  g: 'a',
  h: 'a',
  j: 'c',
  k: 'j',
  l: 'b',
  m: 'j',
  n: 'g',
  o: 'g',
  p: 'k',
}

function startsWith(letter, item) {
  return item[0].toLowerCase() === letter.toLowerCase()
}

module.exports = Object.keys(uidToDelegate).map(function (uid) {
  var sameFirstLetter = _.curry(startsWith, 2)(uid)
  var randomFirstName = _.sample(firstNames.filter(sameFirstLetter))
  var randomLastName = _.sample(lastNames.filter(sameFirstLetter))

  return {
    uid: uid,
    full_name: randomFirstName + ' ' + randomLastName,
    delegate: uidToDelegate[uid],
  }
})
