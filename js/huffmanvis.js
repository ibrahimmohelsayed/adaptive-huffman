/*global d3, HuffmanInstance*/

var m = [20, 120, 20, 120],
    w = 1280 - m[1] - m[3],
    h = 800 - m[0] - m[2],
    tree = d3.layout.tree()
        .size([h, w]),
    diagonal = d3.svg.diagonal()
        .projection(function (d) {
            return [d.y, d.x];
        }),
    svg = d3.select('#svg-container').append('svg:svg')
        .attr('width', w + m[1] + m[3])
        .attr('height', h + m[0] + m[2])
        .append('svg:g')
        .attr('transform', 'translate(' + m[3] + ',' + m[0] + ')'),
    EPSILON = 1e-6;

document.addEventListener('update', updateTree, false);

/**
 * Updates tree visualisation from the root node.
 */
function updateTree() {
    'use strict';

    update(HuffmanInstance.getRoot());
}

function getNodeText(node) {
    return (!node.symbol && !node.left) ? 'NYT' : node.symbol;
}

function update(source) {

    var duration = 800,
        tmp = parseInt(window.animDurationEl.value, 10);

    if (!isNaN(tmp)) {
        duration = tmp;
    }

    var treeNodes = tree
        .nodes(source);

    var nodes = svg
        .selectAll('g.node')
        .data(treeNodes, function (d) {
            return d.id;
        });

    var nodeEnter = nodes
        .enter()
        .append('svg:g')
        .attr('class', 'node')
        .attr('transform', function () {
            var y = source.y0 || source.y,
                x = source.x0 || source.x;

            return 'translate(' + y + ',' + x + ')';
        });

    nodeEnter
        .append('svg:circle')
        .attr('r', 2)
        .style('fill', function (d) {
            return (d.symbol) ? 'blue' : '#fff';
        });

    nodeEnter
        .append('svg:text')
        .attr('class', 'weight')
        .text(function (d) {
            return d.weight;
        });

    nodeEnter
        .append('svg:text')
        .attr('x', 6)
        .attr('y', 5)
        .attr('class', 'symbol')
        .text(getNodeText);

    nodeEnter
        .append('svg:text')
        .attr('class', 'id')
        .text(function (d) {
            return d.id;
        });

    var nodeUpdate = nodes
        .transition()
        .duration(duration)
        .attr('transform', function (d) {
            return 'translate(' + d.y + ',' + d.x + ')';
        });

    nodeUpdate
        .select('circle')
        .attr('r', 4.5)
        .style('fill', function (d) {
            return d.symbol ? '#777' : '#fff';
        });

    nodes
        .select('.symbol')
        .text(getNodeText)
        .filter(function (d) {
            return d.prevSymbol !== d.symbol;
        })
        .transition()
        .delay(duration)
        .duration(duration)
        .styleTween('stroke', function () {
            return d3.interpolate('orange', 'black');
        })
        .styleTween('stroke-width', function () {
            return d3.interpolate(7, 1);
        });

    nodes
        .select('.weight')
        .filter(function (d) {
            return d.prevWeight !== d.weight;
        })
        .transition()
        .duration(duration * 2)
        .styleTween('stroke-width', function () {
            return d3.interpolate(5, 1);
        })
        .styleTween('stroke', function () {
            return d3.interpolate('green', 'blue');
        })
        .text(function (d) {
            return d.weight;
        });

    var nodeExit = nodes
        .exit()
        .transition()
        .duration(duration)
        .attr('transform', function () {
            return 'translate(' + source.y + ',' + source.x + ')';
        })
        .remove();

    nodeExit
        .select('circle')
        .attr('r', EPSILON);

    nodeExit
        .select('text')
        .style('fill-opacity', EPSILON);


    var links = svg
        .selectAll('path.link')
        .data(tree.links(treeNodes), function (d) {
            return d.target.id;
        });

    links.enter()
        .insert('svg:path', 'g')
        .attr('class', 'link')
        .attr('d', function () {
            var o = {
                x: source.x0 || source.x,
                y: source.y0 || source.y
            };
            return diagonal({source: o, target: o});
        });

    links
        .transition()
        .duration(duration)
        .attr('d', diagonal);

    links.exit()
        .transition()
        .duration(duration)
        .attr('d', function (d) {
            var o = {
                x: source.x,
                y: source.y
            };
            return diagonal({source: o, target: o});
        })
        .remove();

    treeNodes.forEach(function (d) {
        d.prevWeight = d.weight;
        d.prevSymbol = d.symbol;
    });

    // store previous root coordinates for proper animation
    source.x0 = source.x;
    source.y0 = source.y;
}