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
        'hbs!tmpl/SITSManager',
        'hbs!tmpl/SITSManagerItem',
        'underscore'
    ];

    function init(
        Backbone,
        Communicator,
        SITSManagerTmpl,
        SITSManagerItemTmpl
    ) {
        var SITSManagerItemView = Backbone.Marionette.ItemView.extend({
            tagName: 'div',
            className: 'input-group sits-item',
            attributes: {
                'data-toggle': 'popover',
                'data-trigger': 'hover'
            },
            template: {type: 'handlebars', template: SITSManagerItemTmpl},
            templateHelpers: function () {
                var attr = this.model.attributes;
                var toi = attr.selection.toi;
                var ext = attr.selection_extent;
                return {
                    removable: attr.owned && attr.editable,
                    start: formatISOTime(toi.start),
                    end: formatISOTime(toi.end),
                    lats: '[' + ext[1].toFixed(3) + ", " + ext[3].toFixed(3) + ']',
                    lons: '[' + ext[0].toFixed(3) + ", " + ext[2].toFixed(3) + ']',
                    created: formatISOTime(attr.created),
                    updated: formatISOTime(attr.updated)
                };
            },
            events: {
                'click .btn-browse': 'onBrowse',
                'click .btn-edit': 'onEdit',
                'click .btn-remove-locked': 'onRemoveLocked',
                'click .btn-remove': 'onRemove',
                'click .form-control': 'onClick'
            },
            onRender: function () {
                var attr = _.extend(this.model.attributes, this.templateHelpers());
                this.$el.popover({
                    html: true,
                    container: 'body',
                    title: attr.name ? attr.name : attr.identifier,
                    content: ( // TODO: proper content template
                        (attr.description ? attr.description : '') +
                        '<br>&nbsp;<table class="table"><tbody>' +
                        '<tr><td>source:</td><td>' + attr.source + '</td></tr>' +
                        '<tr><td>latitude:</td><td>' + attr.lats + '</td></tr>' +
                        '<tr><td>longitude:</td><td>' + attr.lons + '</td></tr>' +
                        '<tr><td>start:</td><td>' + attr.start + '</td></tr>' +
                        '<tr><td>end:</td><td>' + attr.end + '</td></tr>' +
                        '<tr><td>created:</td><td>' + attr.created + '</td></tr>' +
                        '<tr><td>updated:</td><td>' + attr.updated + '</td></tr>' +
                        '</tbody><table>' +
                        '</div>'
                    )
                });
            },
            onClick: function () {
                this.onSelect();
            },
            onReset: function () {
                this.onBrowse();
            },
            onSelect: function () {
                this.$el.popover('hide');
                Communicator.mediator.trigger(
                    'dialog:open:JobCreation', {'time_series': this.model}
                );
            },
            onBrowse: function () {
                this.$el.popover('hide');
                Communicator.mediator.trigger(
                    'sits:browser:browse', this.model
                );
            },
            onEdit: function () {
                if (this.model.get('editable')) {
                    this.$el.popover('hide');
                    Communicator.mediator.trigger(
                        'sits:editor:edit', this.model
                    );
                }
            },
            onRemove: function () {
                Communicator.mediator.trigger(
                    'time_series:removal:confirm', this.model
                );
            },
            onRemoveLocked: function () {
                console.log(this.model.get('identifier') + '.onRemoveLocked()');
            }
        });

        var SITSManagerView = Backbone.Marionette.CompositeView.extend({
            itemView: SITSManagerItemView,
            appendHtml: function (collectionView, itemView, index) {
                collectionView.$('#sits-list').append(itemView.el);
            },
            templateHelpers: function () {
                return {
                    is_fetching: this.collection.is_fetching,
                    fetch_failed: this.collection.fetch_failed,
                    length: this.collection.length,
                    is_empty: this.collection.length < 1
                };
            },
            tagName: 'div',
            className: 'panel panel-default sits-manager not-selectable',
            template: {type: 'handlebars', template: SITSManagerTmpl},
            events: {
                'click #btn-sits-create': 'onCreateClick',
                'click .close': 'close'
            },
            onShow: function (view) {
                this.listenTo(this.model, 'change', this.render);
                this.listenTo(this.collection, 'sync', this.render);
                this.listenTo(this.collection, 'update', this.render);
                this.listenTo(this.collection, 'reset', this.render);
                this.listenTo(this.collection, 'add', this.render);
                this.listenTo(this.collection, 'remove', this.render);
                this.listenTo(this.collection, 'fetch:start', this.render);
                this.listenTo(this.collection, 'fetch:stop', this.render);
                this.delegateEvents(this.events);
                this.$el.draggable({
                    containment: '#content' ,
                    scroll: false,
                    handle: '.panel-heading'
                });
            },
            onCreateClick: function () {
                Communicator.mediator.trigger('dialog:open:SITSCreation', true);
            }
        });

        return {SITSManagerView: SITSManagerView};
    };

    root.define(deps, init);
}).call(this);
