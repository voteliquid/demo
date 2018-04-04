var firstNames = require('./corpora/firstNames.json').firstNames
// var lastNames = require('./corpora/lastNames.json').lastNames
var _ = require('lodash')

var uidToDelegate = {
  a: 'c',
  b: 'd',
  c: 'a',
  d: 'b',
  e: 'a',
  f: 'v',
  g: 'a',
  h: 'a',
  i: 'g',
  j: 'c',
  k: 'j',
  l: 'b',
  m: 'j',
  n: 'g',
  o: 'g',
  p: 'k',
  q: 'a',
  r: 'b',
  s: 'c',
  t: 'd',
  u: 'e',
  v: 'f',
  w: 'g',
  x: 'h',
  y: 'j',
  z: 'k',
}

function startsWith(letter, item) {
  return item[0].toLowerCase() === letter.toLowerCase()
}

module.exports = Object.keys(uidToDelegate).map(function (uid) {
  var sameFirstLetter = _.curry(startsWith, 2)(uid)
  var randomFirstName = _.sample(firstNames.filter(sameFirstLetter))
  // var randomLastName = _.sample(lastNames.filter(sameFirstLetter))

  return {
    uid: uid,
    full_name: randomFirstName,
    delegate: uidToDelegate[uid],
  }
})
