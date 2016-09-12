// Given a collection of users, tally up the votes for a proposed item.
// See https://github.com/Crowdocracy/liquid-api/issues/5 for full db schemas.

'use strict'

const _ = require('lodash')

// -------------------------
// Prep work for example context
// -------------------------

const voters = require('./example-voters.js') // voters.length === 8
// console.log(voters[4])
// // {
// //   uid: 'e',
// //   full_name: 'Eva Ernst',
// //   delegate: 'a'
// // }

let bill = {
  uid: 'exampleItem',
  name: 'Example Item',
  author: 'e', // voter_uid of 'Eva Ernst'
  body: '',
  date_introduced: new Date('Mon Sep 12 2016 04:34:21 GMT-0700 (PDT)'),
  date_of_vote: new Date('Fri Sep 16 2016 17:00:00 GMT-0700 (PDT)'),
  LD_for: 0,
  LD_against: 0, // these three values default to 0
  LD_abstain: 0,
}

// Generate random votes on exampleItem for all our users
let votes = []
for (let i = 0; i < voters.length; i++) {

  // Pick a random position: 'for', 'against', 'abstain' (explicit), 'no vote' (inherits)
  let position = ['for', 'against', 'abstain', 'no vote'][Math.floor(Math.random() * 4)]

  if (position !== 'no vote') {
    votes.push({
      uid: 'vote' + (i + 1),
      voter: voters[i].uid,
      bill: 'exampleItem',
      position,
      date: new Date,
    })
  }
}
// console.log('votes:\n', votes)

// Create indexes for quick lookups
const votersByUid = _.keyBy(voters, 'uid')
const votesByVoter = _.keyBy(votes, 'voter')

// -------------------------
// Now the actual vote-tallying alorithm begins
// -------------------------

// Given a voter and the record of all votes,
// return that individual's voter position (recursive function)
function resolveIndividualsPosition(voter, votesByVoter) {

  // Did the voter explicitly vote?
  if (votesByVoter.hasOwnProperty(voter.uid)) {
    return votesByVoter[voter.uid].position
  }

  // Otherwise inherit their delegate's position
  const delegate = votersByUid[voter.delegate]
  return resolveIndividualsPosition(delegate, votesByVoter)

  // TODO: protect against endless cycle of no-show votes
}


// Tally up the votes by iterating through each voter
voters.forEach(voter => {

  let position = resolveIndividualsPosition(voter, votesByVoter)
  let isDelegated = !votesByVoter.hasOwnProperty(voter.uid)

  console.log(`${voter.full_name} votes "${position}"${isDelegated ? ' (delegated)' : ''}`)

  if (position === 'for') {
    bill.LD_for++
  }

  if (position === 'against') {
    bill.LD_against++
  }

  if (position === 'abstain') {
    bill.LD_abstain++
  }
})

console.log()
console.log('bill:', bill)
