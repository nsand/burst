(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('d3')) :
	typeof define === 'function' && define.amd ? define(['d3'], factory) :
	(global.burst = factory(global.d3));
}(this, function (d3) { 'use strict';

	d3 = 'default' in d3 ? d3['default'] : d3;

	// The phase shift of the nodes around the circle
	var PHASE_SHIFT = Math.PI / 8;
	// The height of the chart
	var HEIGHT = 150;
	// The margin around the rendering
	var MARGIN = 15;

	/**
	 * Creates a burst chart in the given target
	 * @param {Element} target the target to create the chart within
	 * @param {object} colors the colors to be used in the chart
	 * @param {function} [labelAs] a function to create a label for any node within the cart
	 */
	function Burst(target, colors, labelAs) {
		if (typeof this === 'undefined' || this === window) {
			var args = Array.prototype.map.call(arguments, function (d) { return d; });
			args.unshift(null);
			return new (Function.prototype.bind.apply(Burst, args));
		}
		this.target = target;
		this.colors = colors;
		this.labelAs = function (d) {
			return labelAs ? labelAs(d) : d;
		};
		this.canvas = d3.select(target).append('g');
		var resizer;
		// When the window is resized, render the chart after a brief debounce
		this.onResize = function () {
			if (typeof resizer === 'undefined') {
				resizer = setTimeout(function () {
					this.render(this.data);
					resizer = undefined;
				}.bind(this), 150);
			}
		}.bind(this);
		window.addEventListener('resize', this.onResize, false);
	}

	/**
	 * Renders the chart within the target area, given the provided data
	 * @param {array} data the array of data points to be shown in the burst chart
	 */
	Burst.prototype.render = function (data) {
		data = data || [];
		this.data = data;

		// The period is determined by the number of nodes being rendered
		var period = data.length > 0 ?  Math.PI * 2 / data.length : 0;

		var parent = this.target.parentNode;
		var width = parent.clientWidth;

		// Always center the burst
		var OFFSET = {
			x: width / 2,
			y: HEIGHT / 2
		};

		// Determine the radius of the chart based on the available width
		var radius = Math.min(width, HEIGHT) / 2 - MARGIN;

		// Update the chart's space
		d3.select(this.target).attr('width', width).attr('height', HEIGHT);

		// HACK: Remove all children and start fresh each time
		this.canvas.selectAll('path,g').remove();

		// Gather up old chart nodes and create new ones based on the passed-in data
		var nodeData = this.canvas.selectAll('.node').data(data, identity);
		// Handle all new and existing nodes
		var nodes = nodeData.enter().append('g').attr('class', 'node');

		// Always transform .nodes, since resizing doesn't change the data and only re-renders
		this.canvas.selectAll('.node').attr('transform', function (d, i) { return 'translate(' + (OFFSET.x + transformX(i)) + ', ' + (OFFSET.y + transformY(i)) + ')'; });

		// Draw the actual node circles and corresponding text with their canvas
		nodes.append('circle').attr('r', 10).attr('fill', this.colors.nodeFill).attr('stroke', this.colors.nodeStroke).attr('stroke-width', 3);
		nodes.append('text').text(this.labelAs).attr('dy', 5)
			.attr('text-anchor', function (d, i) { return transformX(i) > 0 ? 'start' : 'end'; })
			.attr('dx', function (d, i) { return transformX(i) > 0 ? 20 : -20; });

		// Gather up the old connectors and create new ones based on the passed-in data
		var connectorData = this.canvas.selectAll('.connector').data(data, identity);
		connectorData.enter().insert('line', 'g').attr('class', 'connector')
			.attr('stroke', '#333')
			.attr('stroke-width', '2');

		// Always transform .connectors, since resizing doesn't change the data and only re-renders
		this.canvas.selectAll('.connector')
			.attr('x1', OFFSET.x)
			.attr('y1', OFFSET.y)
			.attr('x2', function (d, i) { return OFFSET.x + transformX(i); })
			.attr('y2', function (d, i) { return OFFSET.y + transformY(i); });

		// Clean up any old nodes and connectors
		nodeData.exit().remove();
		connectorData.exit().remove();

		/**
			* Get the x-coordinate for the ith node
			* @param {number} i the index of the node
			* @returns {number} the x-coordinate for the ith node
			*/
		function transformX(i) {
			return radius * Math.cos(i * period - PHASE_SHIFT);
		}

		/**
			* Get the y-coordinate for the ith node
			* @param {number} i the index of the node
			* @returns {number} the y-coordinate for the ith node
			*/
		function transformY(i) {
			return radius * Math.sin(i * period - PHASE_SHIFT);
		}

	};

	/**
	 * Destroys the chart, removing the resize event listener.
	 */
	Burst.prototype.destroy = function () {
		window.removeEventListener('resize', this.onResize);
	};

	/**
	 * Provides an identity string to be used by the data function
	 * @param {object} d the data point
	 * @returns {string} the string representation of the json object
	 */
	function identity(d) {
		return JSON.stringify(d);
	}

	return Burst;

}));