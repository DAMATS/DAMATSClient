//------------------------------------------------------------------------------
//
// Project: DAMATS Client
// Authors: Martin Paces <martin.paces@eox.at>
//
//------------------------------------------------------------------------------
// Copyright (C) 2015 EOX IT Services GmbH
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
        'hbs!tmpl/SITSRemoval',
        'underscore'
    ];

    function init(
        Backbone,
        Communicator,
        SITSRemovalTmpl
    ) {
        var SITSRemovalView = Backbone.Marionette.CompositeView.extend({
            tagName: 'div',
            className: 'modal fade',
            template: {type: 'handlebars', template: SITSRemovalTmpl},
            templateHelpers: function () {
                var toi = this.model.get('selection').toi;
                var ext = this.model.get('selection_extent');
                return {
                    start: formatISOTime(toi.start),
                    end: formatISOTime(toi.end),
                    lats: '[' + ext[1].toFixed(3) + ", " + ext[3].toFixed(3) + ']',
                    lons: '[' + ext[0].toFixed(3) + ", " + ext[2].toFixed(3) + ']',
                    created: formatISOTime(this.model.get('created')),
                    updated: formatISOTime(this.model.get('updated'))
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
                'click #sits-removal-accept': 'onAccept',
                'hidden.bs.modal': 'onCancel'
            },
            onShow: function (view) {
                this.delegateEvents(this.events);
            },
            onCancel: function () {
                Communicator.mediator.trigger(
                    'dialog:close:SITSRemove', this.model
                );
            },
            onAccept: function () {
                this.model.destroy({
                    wait: true,
                    success: function(model) {
                        Communicator.mediator.trigger('sits:removed', model);
                    }
                });
            }
        });
        return {SITSRemovalView: SITSRemovalView};
    };

    root.define(deps, init);
}).call(this);
