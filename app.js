/* global d3 */

var exampleVoters = require('./example-voters.js').map(function (voter) {
  return Object.assign({}, voter, {
    name: voter.uid,
  })
})

var uidToNameMap = exampleVoters.reduce(function (memo, voter) {
  memo[voter.name] = voter.full_name
  return memo
}, {})

var links = exampleVoters.map(function (voter) {
  return { source: voter.name, target: voter.delegate, type: 'suit' }
})

var nodes = {}
var width = 500
var height = 500

// Convert links to weird d3 nodes object
links.forEach(function (link) {
  link.source = nodes[link.source] || (nodes[link.source] = {
    name: link.source, full_name: uidToNameMap[link.source],
  })
  link.target = nodes[link.target] || (nodes[link.target] = {
    name: link.target, full_name: uidToNameMap[link.target],
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
    .data(['suit', 'licensing', 'resolved'])
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
    .call(force.drag)

var text = svg.append('g').selectAll('text')
    .data(force.nodes())
  .enter()
    .append('text')
    .attr('x', 13)
    .attr('y', '.31em')
    .text(function (d) { return d.full_name })

// Use elliptical arc path segments to doubly-encode directionality.
function tick() {
  path.attr('d', linkArc)  // eslint-disable-line no-use-before-define
  circle.attr('transform', transform)  // eslint-disable-line no-use-before-define
  text.attr('transform', transform)  // eslint-disable-line no-use-before-define
}

function linkArc(d) {
  var dx = d.target.x - d.source.x
  var dy = d.target.y - d.source.y
  var dr = Math.sqrt(dx * dx + dy * dy) // eslint-disable-line no-mixed-operators
  return 'M' + d.source.x + ',' + d.source.y + 'A' + dr + ',' + dr + ' 0 0,1 ' + d.target.x + ',' + d.target.y
}

function transform(d) {
  return 'translate(' + d.x + ',' + d.y + ')'
}
