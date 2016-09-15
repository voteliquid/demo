/* global d3 */

var _ = require('lodash')

var exampleVoters = require('./example-voters.js').map(function (voter) {
  return Object.assign({}, voter, {
    name: voter.uid,
  })
})

var votersByUid = _.keyBy(exampleVoters, 'uid')

var links = exampleVoters.map(function (voter) {
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
        .attr('class', function (d) { return 'vote ' + d.vote })
  text.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')' })
}

var generateRandomVotes = require('./generate-random-votes.js')

document.getElementById('simulate').onclick = function () {
  exampleVoters.forEach(function clearVotes(voter) {
    nodes[voter.uid].vote = undefined
  })
  generateRandomVotes(exampleVoters).forEach(function (vote) {
    nodes[vote.voter_uid].vote = vote.position
  })
}
