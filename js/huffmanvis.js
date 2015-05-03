/*global d3, HuffmanInstance*/
/**
 * Initializes visualisation for Huffman encoder.
 */
function initVis() {
    'use strict';

    // unbind previous listener
    document.removeEventListener('log', updateTree, false);

    // get the root of the encoding tree
    root = HuffmanInstance.getRoot();
    root.parent = root;
    root.px = root.x;
    root.py = root.y;

    updateTree();
    document.addEventListener('log', updateTree, false);

}

/**
 * Updates tree visualisation from the root node.
 */
function updateTree() {
    'use strict';

    update(root);
}

var m = [20, 120, 20, 120],
    w = 1280 - m[1] - m[3],
    h = 800 - m[0] - m[2],
    i = 0,
    root,
    tree = d3.layout.tree()
        .size([h, w]),
    diagonal = d3.svg.diagonal()
        .projection(function (d) {
            'use strict';

            return [d.y, d.x];
        }),
    svg = d3.select('#svg-container').append('svg:svg')
        .attr('width', w + m[1] + m[3])
        .attr('height', h + m[0] + m[2])
        .append('svg:g')
        .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

function update(source) {
    'use strict';

    var duration = 800,
        tmp = parseInt(window.animDurationEl.value, 10);

    if (!isNaN(tmp)) { // defined in huffman.htm
        duration = tmp;
    }

    var nodes = tree.nodes(root).reverse();

    var node = svg.selectAll('g.node')
        .data(nodes, function (d) {
            return d.id;
        });

    var nodeEnter = node.enter().append('svg:g')
        .attr('class', 'node')
        .attr('transform', function () {
            return 'translate(' + source.y0 + ',' + source.x0 + ')';
        });

    nodeEnter.append('svg:circle')
        .attr('r', 2)
        .style('fill', function (d) {
            return (d.symbol) ? 'blue' : '#fff';
        });

    nodeEnter.append('svg:text')
        .attr('x', -8)
        .attr('y', -8)
        .text(function (d) {
            return d.weight;
        })
        .attr('class', 'weight');

    nodeEnter.append('svg:text')
        .attr('x', 6)
        .attr('y', 5)
        .text(function (d) {
            return (!d.symbol && !d.left) ? 'NYT' : d.symbol;
        })
        .attr('class', 'symbol');

    nodeEnter.append('svg:text')
        .attr('x', -8)
        .attr('y', 20)
        .text(function (d) {
            return d.id;
        })
        .attr('class', 'id');


    var nodeUpdate = node.transition()
        .duration(duration)
        .attr('transform', function (d) {
            return 'translate(' + d.y0 + ',' + d.x0 + ')';
        });

    nodeUpdate.select('circle')
        .attr('r', 4.5)
        .style('fill', function (d) {
            return d.symbol ? '#777' : '#fff';
        });

    var changedSymbols = node.select('.symbol')
        .text(function (d) {
            return (!d.symbol && !d.left) ? 'NYT' : d.symbol;
        })
        .filter(function (d) {
            return d.prevSymbol !== d.symbol;
        });

    if (changedSymbols[0].length) {
        changedSymbols.transition()
            .duration(duration * 2)
            .styleTween("stroke", function () {
                return d3.interpolate("orange", "black");
            })
            .styleTween("stroke-width", function () {
                return d3.interpolate(7, 1);
            });
    }

    node.select('.weight')
        .filter(function (d) {
            return d.prevWeight !== d.weight;
        })
        .transition()
        .duration(duration * 2)
        .styleTween("stroke-width", function () {
            return d3.interpolate(5, 1);
        })
        .styleTween("stroke", function () {
            return d3.interpolate("green", "blue");
        })
        .text(function (d) {
            return d.weight;
        });

    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr('transform', function () {
            return 'translate(' + source.y + ',' + source.x + ')';
        })
        .remove();

    nodeExit.select('circle')
        .attr('r', 1e-6);

    nodeExit.select('text')
        .style('fill-opacity', 1e-6);

    var link = svg.selectAll('path.link')
        .data(tree.links(nodes), function (d) {
            return d.target.id;
        });

    link.enter().insert('svg:path', 'g')
        .attr('class', 'link')
        .attr('d', function (d) {
            var o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
        })
        .transition()
        .duration(duration)
        .attr('d', diagonal);

    link.transition()
        .duration(duration)
        .attr('d', diagonal);

    link.exit().transition()
        .duration(duration)
        .attr('d', function (d) {
            var o = {x: source.x, y: source.y};
            return diagonal({source: o, target: o});
        })
        .remove();

    nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
        d.prevWeight = d.weight;
        d.prevSymbol = d.symbol;
    });
}