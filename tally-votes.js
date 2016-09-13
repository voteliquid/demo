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
  votes_yay: 0,// these tally values all default to 0
  votes_yay_from_delegate: 0,
  votes_nay: 0,
  votes_nay_from_delegate: 0,
  votes_blank: 0,
  votes_blank_from_delegate: 0,
  votes_no_vote: 0,
}

// Generate random votes on exampleItem for all our users
let votes = []
for (let i = 0; i < voters.length; i++) {

  // Pick a random position: 'yay', 'nay', 'blank' (explicit abstain), 'no_vote' (inherits)
  let position = ['yay', 'nay', 'blank', 'no_vote'][Math.floor(Math.random() * 4)]

  if (position !== 'no_vote') {
    votes.push({
      uid: 'vote' + (i + 1),
      voter_uid: voters[i].uid,
      bill: 'exampleItem',
      position,
      date: new Date,
    })
  }
}
console.log('votes:\n', votes, '\n')

// Create indices for quick lookups
const votersByUid = _.keyBy(voters, 'uid')
const votesByVoterUid = _.keyBy(votes, 'voter_uid')

// -------------------------
// Now the actual vote-tallying alorithm begins
// -------------------------

// declare cycleState so resolveIndividualsPosition has access
let cycleState

// Given a voter and the record of all votes,
// return that individual's voter position (recursive)
function resolveIndividualsPosition(voter, votesByVoterUid) {
  // Did the voter explicitly vote?
  if (votesByVoterUid.hasOwnProperty(voter.uid)) {
    return votesByVoterUid[voter.uid].position
  }

  // Protect against endless cycle of no-show votes
  cycleState.hare = votersByUid[votersByUid[cycleState.hare.delegate].delegate]
  if (!votesByVoterUid.hasOwnProperty(cycleState.hare.uid)) {
    cycleState.tortoise = votersByUid[cycleState.tortoise.delegate]
    if (cycleState.hare === cycleState.tortoise) {
      return 'no_vote'
    }
  }

  // Otherwise inherit their delegate's position
  const delegate = votersByUid[voter.delegate]
  return resolveIndividualsPosition(delegate, votesByVoterUid)
}


// Tally up the votes by iterating through each voter
voters.forEach(voter => {

  // reset cycleState to implement Floyd's Cycle-Finding Algorithm
  cycleState = {
    tortoise: voter,
    hare: voter,
  }

  let position = resolveIndividualsPosition(voter, votesByVoterUid, cycleState)
  let isDelegated = !votesByVoterUid.hasOwnProperty(voter.uid)

  // increment tally counter for the appropriate key
  let tallyKey = 'votes_' + position
  if (position !== 'no_vote' && isDelegated) {
    tallyKey += '_from_delegate'
  }
  bill[tallyKey]++
  console.log(voter.full_name, tallyKey)
})

console.log('\nbill:', bill)

// Calculate and print the effective final tallies
const finalTally = {
  yay: bill.votes_yay + bill.votes_yay_from_delegate,
  nay: bill.votes_nay + bill.votes_nay_from_delegate,
  voted: voters.length - bill.votes_no_vote, // is there a quorum?
  potential_voters: voters.length,
  delegated: bill.votes_yay_from_delegate + bill.votes_nay_from_delegate + bill.votes_blank_from_delegate,
}
console.log('\nfinalTally:', finalTally)
