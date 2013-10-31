/**
 * Tiny SVG chart generator
 */

(function () {
    'use strict';

    var TEMPLATE = '<svg xmlns="http://www.w3.org/2000/svg" width="%width%" height="%height%">' +
            '<g transform="translate(%paddingX% %paddingY%)">' +
            '<path fill="none" stroke="#888" stroke-width="1" stroke-dasharray="3" %baseline%></path>' +
            '<path fill="none" stroke="%color%" stroke-width="%lineWidth%" d="%pathData%"></path>' +
            '</g>' +
            '</svg>',

        DEFAULT_CONFIG = {
            "width": 120,
            "height": 40,
            "color": '#666',
            "lineWidth": 1,
            "paddingX": 1,
            "paddingY": 1,
            "smooth": false,
            "baseline": false
        };

    var Noorye = function (config) {
        this.baseConfig = this._extend({}, DEFAULT_CONFIG);
        this._extend(this.baseConfig, config);
        this.config = this._extend({}, this.baseConfig);
    };

    Noorye.prototype._extend = function (base, extend) {
        if (!extend) {
            return base;
        }

        Object.keys(extend).forEach(function (key) {
            base[key] = extend[key];
        });

        return base;
    };

    Noorye.prototype._getPointFunc = function (data) {
        var config = this.config,
            xInc = (config.width - config.paddingX * 2) / (data.length - 1),
            max = data[0],
            min = data[0],
            cubicInc = xInc / 3,
            yScale;

        if (typeof config.baseline === 'number') {
            min = Math.min(+config.baseline, min);
            max = Math.max(+config.baseline, max);
        }

        data.forEach(function (value) {
            max = Math.max(value, max);
            min = Math.min(value, min);
        });

        yScale = max === min ? 1 : (config.height - config.paddingY * 2)  / (max - min);

        return {
            smooth: function (index, value, point) {
                var xPos = xInc * index;
                value = (max - value) * yScale;

                if (index === 0) {
                    return ['M', xPos, value].join(' ');
                }

                point = (max - point) * yScale;
                return [
                    'C',
                    xPos - xInc + cubicInc, point,
                    xPos - cubicInc, value,
                    xPos, value
                ].join(' ');
            },
            sharp: function (index, value, halfAlign) {
                value = (max - value) * yScale;
                if (halfAlign) {
                    value = Math.floor(value) + 0.5;
                }
                if (index === 0) {
                    return ['M', 0, value].join(' ');
                }
                return ['L', xInc * index, value].join(' ');
            }
        };
    };

    Noorye.prototype._buildSVG = function (data) {
        var config = this.config,
            svg = TEMPLATE;

        if (typeof data === 'object') {
            Object.keys(data).forEach(function (key) {
                var re = new RegExp('%' + key + '%', 'g');
                svg = svg.replace(re, data[key]);
            });
        }

        if (typeof config === 'object') {
            Object.keys(config).forEach(function (key) {
                var re = new RegExp('%' + key + '%', 'g');
                svg = svg.replace(re, config[key]);
            });
        }

        svg = svg.replace(/%\w+%/g, '');

        return svg;
    };

    Noorye.prototype.configure = function (config) {
        this._extend(this.baseConfig, config);
    };

    Noorye.prototype.buildChart = function (data, config) {
        if (!data instanceof Array) {
            throw new Error("buildChart 'data' parameter should be one-dimensional array");
        }

        if (data.length < 2) {
            throw new Error("buildChart 'data' parameter should contains at least 2 items");
        }

        data = data.slice();
        this.config = this._extend({}, this.baseConfig);
        config = this._extend(this.config, config);

        var getPointFunc = this._getPointFunc(data),
            getPoint = config.smooth ? getPointFunc.smooth : getPointFunc.sharp,
            cursor = data[0],
            path = [],
            chartData = {};

        if (typeof config.baseline === 'number') {
            chartData.baseline = ['d="', getPointFunc.sharp(0, config.baseline, true), getPointFunc.sharp(data.length - 1, config.baseline, true), '"'].join(' ');
        } else {
            chartData.baseline = "";
        }

        data.forEach(function (value, index) {
            path.push(getPoint(index, value, cursor));
            cursor = value;
        });

        chartData.pathData = path.join(' ');

        return this._buildSVG(chartData);
    };


    if ('undefined' !== typeof window) {
        window.Noorye = Noorye;
    }
    if ('undefined' !== typeof module) {
        module.exports = Noorye;
    }
}());