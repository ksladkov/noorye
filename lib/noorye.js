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
            max = -Infinity,
            min = +Infinity,
            cubicInc = xInc / 3,
            yScale;

        if (typeof config.baseline === 'number') {
            min = Math.min(+config.baseline, min);
            max = Math.max(+config.baseline, max);
        }

        data.forEach(function (value) {
            if (value === null) {
                return;
            }
            max = Math.max(value, max);
            min = Math.min(value, min);
        });

        if (max === min) {
            yScale = 1;
            max += (config.height - config.paddingY * 2) / 2;
        } else {
            yScale = (config.height - config.paddingY * 2)  / (max - min);
        }

        return {
            smooth: function (index, value, point, nullBefore, nullAfter) {
                if (value === null) {
                    return '';
                }

                var xPos = xInc * index;
                value = (max - value) * yScale;

                if (index === 0 || nullBefore) {
                    return ['M', xPos, value].join(' ') + (nullAfter ? 'h-0.5v-0.5h0.5v0.5' : '');
                }

                point = (max - point) * yScale;
                return [
                    'C',
                    xPos - xInc + cubicInc, point,
                    xPos - cubicInc, value,
                    xPos, value
                ].join(' ');
            },
            sharp: function (index, value, halfAlign, nullBefore, nullAfter) {
                if (value === null) {
                    return '';
                }
                value = (max - value) * yScale;
                if (halfAlign) {
                    value = Math.floor(value) + 0.5;
                }
                if (index === 0 || nullBefore) {
                    return ['M', xInc * index, value].join(' ') + (nullAfter ? 'h-0.5v-0.5h0.5v0.5' : '');
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

    Noorye.prototype.errors = {
        wrongData: "buildChart 'data' parameter should be one-dimensional array which contains at least 2 items"
    };

    Noorye.prototype.buildChart = function (data, config) {
        if (!data instanceof Array || data.length < 2) {
            throw new Error(this.errors.wrongData);
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
            var nullBefore = index === 0 || data[index - 1] === null,
                nullAfter = (index >= data.length - 1) || (data[index + 1] === null);
            path.push(getPoint(index, value, cursor, nullBefore, nullAfter));
            cursor = value;
        });

        chartData.pathData = path.join(' ');

        return this._buildSVG(chartData);
    };


    if (typeof window !== 'undefined') {
        window.Noorye = Noorye;
    }
    if (typeof module !== 'undefined') {
        module.exports = Noorye;
    }
    if (typeof modules !== 'undefined') {
        modules.define('noorye', function (provide) {
            provide(Noorye);
        });
    }
}());
