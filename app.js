/* global d3 */

var _ = require('lodash')

var voters = require('./example-voters.js').map(function (voter) {
  return Object.assign({}, voter, {
    name: voter.uid,
  })
})

var votersByUid = _.keyBy(voters, 'uid')

var links = voters.map(function (voter) {
  return { source: voter.name, target: voter.delegate, type: 'delegation' } // can add other edge types
})

var nodes = {}
var width = 500
var height = 400

// Convert links to weird d3 nodes object
links.forEach(function (link) {
  link.source = nodes[link.source] || (nodes[link.source] = {
    name: link.source,
    full_name: votersByUid[link.source].full_name,
    vote: votersByUid[link.source].vote,
    isDelegated: votersByUid[link.source].isDelegated,
  })
  link.target = nodes[link.target] || (nodes[link.target] = {
    name: link.target,
    full_name: votersByUid[link.target].full_name,
    vote: votersByUid[link.target].vote,
    isDelegated: votersByUid[link.target].isDelegated,
  })
})

var force = d3.layout.force()
    .nodes(d3.values(nodes))
    .links(links)
    .size([width, height])
    .linkDistance(60)
    .charge(-300)
    .on('tick', tick) // eslint-disable-line no-use-before-define
    .start()

var svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height)

// Per-type markers, as they don't inherit styles.
svg.append('defs').selectAll('marker')
    .data(['delegation'])
  .enter()
    .append('marker')
    .attr('id', function (d) { return d })
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 20)
    .attr('refY', -1.5)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
  .append('path')
    .attr('d', 'M0,-5L10,0L0,5')

var path = svg.append('g').selectAll('path')
    .data(force.links())
  .enter()
    .append('path')
    .attr('class', function (d) { return 'link ' + d.type })
    .attr('marker-end', function (d) { return 'url(#' + d.type + ')' })

var circle = svg.append('g').selectAll('circle')
    .data(force.nodes())
  .enter()
    .append('circle')
    .attr('r', 10)
    .attr('class', function (d) { return 'vote ' + d.vote })
    .call(force.drag)

var text = svg.append('g').selectAll('text')
    .data(force.nodes())
  .enter()
    .append('text')
    .attr('x', 13)
    .attr('y', '.31em')
    .text(function (d) { return d.full_name })

function tick() {
  path.attr('d', function linkArc(d) {
    var dx = d.target.x - d.source.x
    var dy = d.target.y - d.source.y
    var dr = Math.sqrt(dx * dx + dy * dy) // eslint-disable-line no-mixed-operators
    return 'M' + d.source.x + ',' + d.source.y + 'A' + dr + ',' + dr + ' 0 0,1 ' + d.target.x + ',' + d.target.y
  })
  circle.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')' })
        .attr('class', function (d) { return 'vote ' + d.vote + (d.isDelegated ? ' isDelegated' : '') })
  text.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')' })
}

var generateRandomVotes = require('./generate-random-votes.js')

// declare cycleState so resolveIndividualsPosition has access
var cycleState

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
  var delegate = votersByUid[voter.delegate]
  return resolveIndividualsPosition(delegate, votesByVoterUid)
}

document.getElementById('simulate').onclick = function () {
  // clear existing votes
  voters.forEach(function (voter) {
    nodes[voter.uid].vote = undefined
  })
  var bill = {
    uid: 'exampleItem',
    name: 'Example Item',
    author: 'e', // voter_uid of 'Eva Ernst'
    body: '',
    date_introduced: new Date('Mon Sep 12 2016 04:34:21 GMT-0700 (PDT)'),
    date_of_vote: new Date('Fri Sep 16 2016 17:00:00 GMT-0700 (PDT)'),
    votes_yay: 0, // these tally values all default to 0
    votes_yay_from_delegate: 0,
    votes_nay: 0,
    votes_nay_from_delegate: 0,
    votes_blank: 0,
    votes_blank_from_delegate: 0,
    votes_no_vote: 0,
  }

  var votes = generateRandomVotes(voters)

  // Create indices for quick lookups
  var votesByVoterUid = _.keyBy(votes, 'voter_uid')

  // Tally up the votes by iterating through each voter
  voters.forEach(function (voter) {
    // reset cycleState to implement Floyd's Cycle-Finding Algorithm
    cycleState = {
      tortoise: voter,
      hare: voter,
    }

    var position = resolveIndividualsPosition(voter, votesByVoterUid, cycleState)
    var isDelegated = !votesByVoterUid.hasOwnProperty(voter.uid)

    // increment tally counter for the appropriate key
    var tallyKey = 'votes_' + position
    if (position !== 'no_vote' && isDelegated) {
      tallyKey += '_from_delegate'
    }
    bill[tallyKey]++
    console.log(voter.full_name, tallyKey)
    nodes[voter.uid].vote = position
    nodes[voter.uid].isDelegated = isDelegated
  })

  document.getElementById('yay-count').innerText = bill.votes_yay + bill.votes_yay_from_delegate
  document.getElementById('nay-count').innerText = bill.votes_nay + bill.votes_nay_from_delegate
}
