module.exports = function generateRandomVotes(voters) {
  // Elected rep always votes
  var votes = [{
    voter_uid: 'a',
    position: ['yea', 'nay'][Math.floor(Math.random() * 2)],
  }]

  for (var i = 1; i < voters.length; i++) {
    // Pick a random position: 'yea', 'nay', 'no_vote' (inherits)
    var position = ['yea', 'nay', 'no_vote', 'no_vote'][Math.floor(Math.random() * 4)]

    if (position !== 'no_vote') {
      votes.push({
        voter_uid: voters[i].uid,
        position: position,
      })
    }
  }

  return votes
}
