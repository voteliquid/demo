module.exports = function generateRandomVotes(voters) {
  var votes = []
  for (var i = 0; i < voters.length; i++) {
    // Pick a random position: 'yea', 'nay', 'no_vote' (inherits)
    var position = ['yea', 'nay', 'no_vote', 'no_vote'][Math.floor(Math.random() * 4)]

    if (position !== 'no_vote') {
      votes.push({
        uid: 'vote' + (i + 1),
        voter_uid: voters[i].uid,
        bill: 'exampleItem',
        position: position,
        date: new Date(),
      })
    }
  }
  // console.log('votes:\n', votes, '\n')

  return votes
}
