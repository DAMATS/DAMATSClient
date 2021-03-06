//------------------------------------------------------------------------------
//
// Project: DAMATS Client
// Authors: Martin Paces <martin.paces@eox.at>
//
//------------------------------------------------------------------------------
// Copyright (C) 2017 EOX IT Services GmbH
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
        'globals',
        'app',
        'modules/damats/ClassStatisticsView'
    ];

    function init(
        Backbone,
        Communicator,
        globals,
        App,
        ClassStatisticsView
    ) {
        var ClassStatisticsController = Backbone.Marionette.Controller.extend({
            model: null,
            view: null,

            initialize: function (options) {
                this.listenTo(Communicator.mediator, 'class:statistics:display', this.onRequest);
                this.listenTo(Communicator.mediator, 'dialog:close:ClassStatistics', this.onClose);
            },

            onRequest: function (model, output, options) {
                if (!this.isClosed()) {
                    this.view.close();
                }
                this.model = model;
                this.view = new ClassStatisticsView.ClassStatisticsView(_.extend({
                    output: output,
                    model: model
                }, options || {}));
                App.dialogRegion.show(this.view);
            },

            isClosed: function () {
                return !this.view || _.isUndefined(this.view.isClosed) || this.view.isClosed;
            },

            onClose: function (event_) {
                if (!this.isClosed()) {
                    this.view.close();
                }
                this.view = null;
                // Region.empty() not available. Might be a version issue.
                //App.dialogRegion.empty();
            }
        });

        return new ClassStatisticsController();
    };

    root.require(deps, init);
}).call(this);

