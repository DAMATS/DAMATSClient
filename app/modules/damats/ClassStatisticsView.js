//------------------------------------------------------------------------------
//
// Project: DAMATS Client
// Authors: Martin Paces <martin.paces@eox.at>
//
//------------------------------------------------------------------------------
// Copyright (C) 2016 EOX IT Services GmbH
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies of this Software or works derived from this Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//------------------------------------------------------------------------------

(function () {
    'use strict';
    var root = this;
    var deps = [
        'backbone',
        'communicator',
        'hbs!tmpl/ClassStatistics',
        'underscore'
    ];

    function init(
        Backbone,
        Communicator,
        ClassStatisticsTmpl
    ) {
        function format_percent(number) {
            var ndec;
            if (Math.abs(number) < 0.01) {
                ndec = 3;
            } else if (Math.abs(number) < 0.1) {
                ndec = 2;
            } else if (Math.abs(number) < 1) {
                ndec = 1;
            } else {
                ndec = 0;
            }
            return (100 * number).toFixed(ndec) + "%";
        }

        var ClassStatisticsView = Backbone.Marionette.CompositeView.extend({
            tagName: 'div',
            className: 'modal fade',
            template: {type: 'handlebars', template: ClassStatisticsTmpl},
            templateHelpers: function () {
                var format_finals;
                // evaluate and format final values
                format_finals = function (item) {
                    item.formatted = format_percent(item.count / this.count);
                    _.each(_.zip(item.counts, this.classes), function (pair) {
                        pair[0].formatted = format_percent(pair[0].value / pair[1].count);
                    });
                };
                _.each(this.lc_classes, _.bind(format_finals, this));

                return {
                    is_fetching: this.fetch_status == 'fetching',
                    fetch_failed: this.fetch_status == 'failure',
                    classes: this.classes,
                    lc_classes: this.lc_classes,
                    output: this.output
                };
            },
            attributes: {
                role: 'dialog',
                tabindex: '-1',
                'aria-labelledby': 'about-title',
                'aria-hidden': true,
                'data-keyboard': true,
                'data-backdrop': 'static'
            },
            events: {
            },
            onShow: function (view) {
                this.delegateEvents(this.events);
            },
            initialize: function (options) {
                this.fetch_status == 'fetching';
                this.output = options.output;
                this.lc_class_idx = options.lc_class_idx;
                this.class_idx = options.class_idx;
                // get reference dataset name
                this.fetch();
            },
            fetch: function () {
                this.fetch_status == 'fetching';
                $.ajax(this.output.reference.url, {
                    dataType: 'text',
                    accepts: this.output.reference.mime_type,
                    success: _.bind(this.parse, this),
                    error: _.bind(function (jqXHR, textStatus, errorThrown) {
                        this.fetch_status = 'failure';
                        this.render();
                    })

                });
            },
            parse: function (data) {
                // parse the TSV table
                data = data.split('\r\n');
                data = _.map(data, function (line) {return line.split('\t');});
                // parse class labels and pixel counts
                this.count = Number(data[1][1]);
                this.classes = _.map(
                    _.zip(data[0].slice(2), data[1].slice(2)),
                    _.bind(function (pair, index) {
                        return {
                            highlighted: this.class_idx == index,
                            label: pair[0],
                            count: Number(pair[1])
                        };
                    }, this)
                );
                // parse land-cover classes
                this.lc_classes = _.sortBy(
                    _.map(
                        _.filter(
                            data.slice(2),
                            function (line) { return Number(line[1]) > 0; }
                        ),
                        _.bind(function (line, line_index) {
                            return {
                                highlighted: this.lc_class_idx == line_index,
                                label: line[0],
                                count: Number(line[1]),
                                counts: _.map(
                                    line.slice(2),
                                    _.bind(function (value, index) {
                                        return {
                                            value: Number(value),
                                            highlighted: (
                                                (this.class_idx == index) ||
                                                (this.lc_class_idx == line_index)
                                            )
                                        };
                                    }, this)
                                )
                            };
                        }, this)
                    ),
                    function (item) { return -item.count; }
                );
                // get rid of the others if no present
                if (this.classes[this.classes.length - 1].count == 0) {
                    this.classes.pop();
                    _.each(this.lc_classes, function (item) {
                        item.counts.pop();
                    });
                }
                this.fetch_status = 'success' ;
                this.render();
            }
        });
        return {ClassStatisticsView: ClassStatisticsView};
    };

    root.define(deps, init);
}).call(this);
