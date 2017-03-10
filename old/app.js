/* global d3, ga */

var _ = require('lodash')

var voters = require('./example-voters.js').map(function (voter) {
  return Object.assign({}, voter, {
    name: voter.uid,
  })
})

var votersByUid = _.keyBy(voters, 'uid')

var links = voters.slice(1).map(function (voter) {
  return {
    source: voter.name,
    target: voter.delegate,
    type: 'delegation',
  }
})

var nodes = {}
var width = 900
var height = 400

// Convert links to weird d3 nodes object
links.forEach(function (link) {
  link.source = nodes[link.source] || (nodes[link.source] = {
    name: link.source,
    full_name: votersByUid[link.source].full_name,
    vote: votersByUid[link.source].vote,
  })
  link.target = nodes[link.target] || (nodes[link.target] = {
    name: link.target,
    full_name: votersByUid[link.target].full_name,
    vote: votersByUid[link.target].vote,
  })
})

var force = d3.layout.force()
    .nodes(d3.values(nodes))
    .links(links)
    .size([width, height])
    .linkDistance(160)
    .charge(-300)
    .on('tick', tick) // eslint-disable-line no-use-before-define
    .start()

var svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height)

// Delegation arrows
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
    .attr('class', function () { return 'arrow' })

// Delegation lines
var path = svg.append('g').selectAll('path')
    .data(force.links())
  .enter()
    .append('path')
    .attr('class', 'link')
    .attr('marker-end', function (d) { return 'url(#' + d.type + ')' })

// Vote nodes
var circle = svg.append('g').selectAll('circle')
    .data(force.nodes())
  .enter()
    .append('circle')
    .attr('r', (node) => { return node.name === 'a' ? 30 : 6 })
    .attr('class', function (d) { return 'vote ' + d.vote })
    .on('click', function (d) { clickVoter(d.name) }) // eslint-disable-line no-use-before-define
    .call(force.drag)

// Background rectangle for names
var rect = svg.append('g').selectAll('rect')
  .data(force.nodes())
  .enter()
  .append('rect')
  .attr('x', 13)
  .attr('y', '-0.4em')
  .attr('width', function (d) { return d.full_name.length * 5 })
  .attr('height', 11)
  .style('fill', '#232323')
  .style('fill-opacity', '.6')

// Name labels
var text = svg.append('g').selectAll('text')
    .data(force.nodes())
  .enter()
    .append('text')
    .attr('x', 13)
    .attr('y', '.31em')
    .text(function (d) { return d.full_name })
    .style('fill', '#dcdcdc')

function tick() {
  path.attr('d', function linkArc(d) {
    var dx = d.target.x - d.source.x
    var dy = d.target.y - d.source.y
    var dr = Math.sqrt(dx * dx + dy * dy) // eslint-disable-line no-mixed-operators
    return 'M' + d.source.x + ',' + d.source.y + 'A' + dr + ',' + dr + ' 0 0,1 ' + d.target.x + ',' + d.target.y
  })
  circle.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')' })
  text.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')' })
  rect.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')' })
}

var generateRandomVotes = require('./generate-random-votes.js')

function tallyVotes(indexedVotes) {
  var bill = {
    votes_yea: 0, // these tally values all default to 0
    votes_nay: 0,
    votes_no_vote: 0,
  }

  // Tally up the votes by iterating through each voter
  voters.forEach(function (voter) {
    var position
    // Did the voter explicitly vote?
    if (indexedVotes.hasOwnProperty(voter.uid)) {
      position = indexedVotes[voter.uid].position
    } else {
      position = 'no_vote'
    }

    // Increment tally counter for the appropriate key
    var tallyKey = 'votes_' + position
    bill[tallyKey]++
    // console.log(voter.full_name, tallyKey)

    // Update the node
    nodes[voter.uid].vote = position
  })

  circle
    .data(force.nodes())
    .attr('class', function (d) { return 'vote ' + d.vote })

  var totalYea = bill.votes_yea
  var totalNay = bill.votes_nay

  var outcome = 'abstain'
  if (indexedVotes.hasOwnProperty('a')) {
    outcome = indexedVotes.a.position
  }

  document.getElementById('yea-count').innerText = totalYea
  document.getElementById('nay-count').innerText = totalNay
  document.getElementById('outcome').innerText = outcome
  document.getElementById('outcome').className = outcome

  path
    .data(force.links())
    .attr('class', function (d) { return 'link' })
}

var votes
var votesByVoterUid = {}

document.getElementById('simulate').onclick = function () {
  // clear existing votes
  voters.forEach(function (voter) {
    nodes[voter.uid].vote = undefined
  })

  votes = generateRandomVotes(voters)
  votesByVoterUid = _.keyBy(votes, 'voter_uid') // Create index for quick lookups

  tallyVotes(votesByVoterUid)

  ga('send', 'event', 'user action', 'simulate button', 'clicked simulate button')
}

function clickVoter(voterUid) {
  var positions = ['yea', 'nay', 'no_vote']

  var newPosition

  if (!votesByVoterUid[voterUid]) {
    newPosition = 'yea'
    votesByVoterUid[voterUid] = {
      voter_uid: voterUid,
    }
  } else {
    var oldPosition = votesByVoterUid[voterUid].position
    newPosition = positions[positions.indexOf(oldPosition) + 1]
  }

  if (newPosition === 'no_vote') {
    delete votesByVoterUid[voterUid]
  } else {
    votesByVoterUid[voterUid].position = newPosition
  }

  tallyVotes(votesByVoterUid)
  ga('send', 'event', 'user action', 'clicked voter', 'clicked voter node')
}

// Start simulated
document.getElementById('simulate').click()
