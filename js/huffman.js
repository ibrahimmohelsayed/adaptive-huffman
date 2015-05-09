/**
 * Adaptive Huffman encoder class.
 *
 * @param {number} alphabetSize Alphabet size for adaptive Huffman encoder.
 * @returns {{encode: Function, getRoot: Function, getCompressionRatio: Function}}
 * @constructor
 */
function AdaptiveHuffman(alphabetSize) {
    'use strict';

    var addNode,
        arrSlice = Array.prototype.slice,
        compInput = 0,
        compOutput = 0,
        encodeCharacter,
        encoder,
        findSymbolNode,
        getHighestIdInBlock,
        getHuffmanCode,
        Helpers,
        isTreeFull = false,
        log,
        maxSize,
        nodes,
        NYTNode,
        root,
        swapNodes,
        symbols;

    /**
     * Helper functions.
     *
     * @type {{swapProperty: Function}, {sendMessage: Function}}
     */
    Helpers = {
        swapProperty: function (objA, objB, property) {
            var tmp = objA[property];
            objA[property] = objB[property];
            objB[property] = tmp;
        },
        sendMessage: function (type, msg) {
            if (window.CustomEvent) {
                var event = new CustomEvent(type, {
                    detail: {
                        message: msg,
                        time: new Date()
                    },
                    bubbles: true,
                    cancelable: true
                });

                document.dispatchEvent(event);
            }
        }
    };

    /**
     * Simple logger.
     */
    log = function () {
        Helpers.sendMessage('log', arrSlice.call(arguments).join(' '));
    };

    /**
     * Simple encoder.
     */
    encoder = function () {
        Helpers.sendMessage('encode', arrSlice.call(arguments).join(''));
    };

    /**
     * Private class representing a single node of Huffman tree.
     *
     * @param {?Node} parent Parent pointer.
     * @param {?string} symbol Node's symbol.
     * @param {number} id Node's id.
     * @constructor
     */
    function Node(parent, symbol, id) {
        this.parent = parent;
        this.left = null;
        this.right = null;
        this.symbol = symbol;
        this.weight = 0;
        this.id = id;
        log('New node created ( id:', this.id, (this.symbol) ? ('symbol: ' + this.symbol) : '', ')');
    }

    /**
     * Increases weight of the node.
     */
    Node.prototype.increaseWeight = function () {
        this.weight++;
        log('Increasing weight of node', this.id);
    };

    /**
     * Fixes weights of the subtree.
     */
    Node.prototype.fixWeights = function () {
        if (this.left && this.right) {
            this.left.fixWeights();
            this.right.fixWeights();
            this.weight = this.left.weight + this.right.weight;
        }
    };

    /**
     * Sets children of the node.
     * @param {Node} [left] left child
     * @param {Node} [right] right child
     */
    Node.prototype.setChildren = function (left, right) {
        this.left = left;
        this.right = right;
        this.children = [];
        if (left) {
            this.children.push(left);
        }
        if (right) {
            this.children.push(right);
        }
    };

    log('Initializing Adaptive Huffman encoder with alphabet size of', alphabetSize);
    symbols = {};
    maxSize = alphabetSize * 2;
    root = new Node(null, null, maxSize);
    nodes = [root];
    NYTNode = root;

    /**
     * Encodes single character.
     *
     * @param {string} symbol Single character to be encoded.
     */
    encodeCharacter = function (symbol) {
        var encoderMsg = '',
            highest,
            isFirstSeen = false,
            isInTree = symbols.hasOwnProperty(symbol),
            node,
            tmp;

        // if symbol wasn't encoded yet
        if (!isInTree) {
            log('Symbol', symbol, 'not in tree yet');
            isFirstSeen = true;
            addNode(symbol);

            // for the first symbol empty character is returned
            if (Object.keys(symbols).length > 1) {
                tmp = getHuffmanCode(NYTNode);
                compOutput += tmp.length;
                encoderMsg += tmp;
            }
            encoderMsg += symbol;
        } else {
            node = findSymbolNode(symbol);
            log('Symbol', symbol, 'is already in the tree (', node.id, ')');
            highest = getHighestIdInBlock(node.weight);
            if (highest && highest.parent && (node.id !== highest.id) && (node.parent.id !== highest.id)) {
                swapNodes(node, highest);
            }
        }

        if (!isTreeFull || isInTree) {

            compInput += symbols[symbol];

            // update weight
            node = findSymbolNode(symbol);
            if (!isFirstSeen) {
                tmp = getHuffmanCode(node);
                compOutput += tmp.length;
                encoderMsg += tmp;
            }
            encoder(encoderMsg);

            node.increaseWeight();

            // fix the tree
            log('Fixing Huffman tree properties');
            while (node !== root) {
                node = node.parent;
                highest = getHighestIdInBlock(node.weight);

                if (highest && highest.parent && (node.id < highest.id) && (node.parent.id !== highest.id)) {
                    swapNodes(node, highest);
                    node = highest;
                }
                node.increaseWeight();
            }
        }

        root.fixWeights();
    };

    /**
     * Finds node representing a given symbol.
     *
     * @param {string} symbol Symbol.
     * @returns {Node} Node for a given symbol
     */
    findSymbolNode = function (symbol) {
        for (var i = 0, l = nodes.length; i < l; i++) {
            if (nodes[i].symbol === symbol) {
                return nodes[i];
            }
        }
    };

    /**
     * Swaps two nodes by replacing their properties.
     *
     * @param {Node} firstNode Instance of first node.
     * @param {Node} secondNode Instance of second node.
     */
    swapNodes = function (firstNode, secondNode) {

        // swap properties
        ['left', 'right', 'parent', 'symbol', 'weight'].forEach(function (property) {
            Helpers.swapProperty(firstNode, secondNode, property);
        });

        firstNode.setChildren(firstNode.left, firstNode.right);
        secondNode.setChildren(secondNode.left, secondNode.right);

        log('Swapped node', firstNode.id, 'with', secondNode.id);
    };

    /**
     * Inserts a node with new symbol by adding children to old 'NYT' node.
     * Left child becomes the new NYT node, right holds the new symbol.
     *
     * @param {string} symbol Single character to be encoded.
     */
    addNode = function (symbol) {
        var newNYTNode,
            symbolNode;

        if (!isTreeFull && (Object.keys(symbols).length < alphabetSize)) {
            symbolNode = new Node(NYTNode, symbol, NYTNode.id - 1);
            newNYTNode = new Node(NYTNode, null, NYTNode.id - 2);
            NYTNode.setChildren(newNYTNode, symbolNode);
            NYTNode = newNYTNode;

            nodes.push(newNYTNode);
            nodes.push(symbolNode);

            symbols[symbol] = symbol.charCodeAt(0).toString(2).length;
        } else {
            isTreeFull = true;
            log('ERROR: No more symbols can be added to the tree.');
        }
    };

    /**
     * Returns node with the highest ID in the block (nodes with the same weight).
     *
     * @param {number} weight Weight of a block.
     * @returns {Node} Node with the highest ID.
     */
    getHighestIdInBlock = function (weight) {
        var i,
            l = nodes.length,
            highest = -1,
            highestNode,
            tmp;

        for (i = 0; i < l; i++) {
            tmp = nodes[i];
            if ((tmp.weight === weight) && tmp.id > highest) {
                highest = tmp.id;
                highestNode = tmp;
            }
        }
        return highestNode;
    };

    /**
     * Returns Huffman code for a given node based on a current encoding tree.
     *
     * @param {Node} node Node for which code should be returned.
     * @returns {string} Encoded character.
     */
    getHuffmanCode = function (node) {
        var arr = [],
            prev;

        while (node !== root) {
            prev = node;
            node = node.parent;
            arr.push((node.left === prev) ? 0 : 1);
        }

        return arr.reverse().join('');
    };

    return {

        /**
         * Encodes single character.
         * @param {string} char Single character to be encoded.
         * @returns {string} Encoded value.
         */
        encode: function (char) {
            var encodedValue = encodeCharacter(char);
            Helpers.sendMessage('update');
            return encodedValue;
        },

        /**
         * Returns the root node of the tree.
         * @returns {Node} Root node.
         */
        getRoot: function () {
            return root;
        },

        /**
         * Returns approximate compression ratio.
         *
         * @returns {string} Compression ratio percentage.
         */
        getCompressionRatio: function () {
            return (compInput / compOutput).toFixed(2);
        }
    };
}