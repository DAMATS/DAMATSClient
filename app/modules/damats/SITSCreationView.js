//------------------------------------------------------------------------------
//
// Project: DAMATS Client
// Authors: Martin Paces <martin.paces@eox.at>
//          Daniel Santillan <daniel.santillan@eox.at>
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
        'hbs!tmpl/SITSCreation',
        'underscore',
        'bootstrap-datepicker'
    ];

    function init(Backbone, Communicator, SITSCreationTmpl) {
        var SITSCreationView = Backbone.Marionette.CompositeView.extend({
            tagName: 'div',
            className: 'panel panel-default sits-creation not-selectable',
            template: {type: 'handlebars', template: SITSCreationTmpl},
            events: {
                'click #btn-draw-bbox': 'onBBoxClick',
                'click #btn-clear-bbox': 'onClearClick',
                'click #btn-sits-create': 'onCreateClick',
                'change #txt-minx': 'onBBoxChange',
                'change #txt-maxx': 'onBBoxChange',
                'change #txt-miny': 'onBBoxChange',
                'change #txt-maxy': 'onBBoxChange',
                'hide': 'onCloseTimeWidget'
            },

            onShow: function (view) {
                this.listenTo(Communicator.mediator, 'time:change', this.onTimeChange);
                this.listenTo(Communicator.mediator, 'selection:changed', this.onSelectionChange);
                this.timeinterval = {};
                this.delegateEvents(this.events);
                this.$('.close').on('click', _.bind(this.onClose, this));
                this.$el.draggable({
                    containment: '#content' ,
                    scroll: false,
                    handle: '.panel-heading'
                });

                var aoi = this.model.get('AoI');
                if (aoi) {
                    $('#txt-minx').val(aoi.left);
                    $('#txt-maxx').val(aoi.right);
                    $('#txt-miny').val(aoi.bottom);
                    $('#txt-maxy').val(aoi.top);
                    this.$('#btn-sits-create').removeAttr('disabled');
                } else {
                    this.$('#btn-sits-create').attr('disabled', 'disabled');
                }

                this.$('#div-date-begin input[type="text"]').datepicker({
                        autoclose: true,
                        format: 'yyyy-mm-dd',
                        keyboardNavigation: false
                });
                this.$('#div-date-begin input[type="text"]').datepicker(
                    'update', this.model.get('ToI').start
                );
                this.$('#div-date-begin input[type="text"]').datepicker(
                    'setDate', this.model.get('ToI').start
                );

                this.$('#div-date-end input[type="text"]').datepicker({
                    autoclose: true,
                    format: 'yyyy-mm-dd'
                });
                this.$('#div-date-end input[type="text"]').datepicker(
                    'update', this.model.get('ToI').end
                );
                this.$('#div-date-end input[type="text"]').datepicker(
                    'setDate', this.model.get('ToI').end
                );

                $(document).on(
                    'touch click', '#div-date-begin .input-group-addon',
                    function (evt) {
                        $('input[type="text"]', $(this).parent()).focus();
                    }
                );
                $(document).on(
                    'touch click', '#div-date-end .input-group-addon',
                    function (evt) {
                        $('input[type="text"]', $(this).parent()).focus();
                    }
                );
            },

            onBBoxClick: function () {
                $('#txt-minx').val('');
                $('#txt-maxx').val('');
                $('#txt-miny').val('');
                $('#txt-maxy').val('');
                Communicator.mediator.trigger(
                    'selection:activated', {id: 'bboxSelection', active: true}
                );
            },

            onClearClick: function () {
                Communicator.mediator.trigger(
                    'selection:activated', {id: 'bboxSelection', active: false}
                );
                $('#txt-minx').val('');
                $('#txt-maxx').val('');
                $('#txt-miny').val('');
                $('#txt-maxy').val('');
                this.$('#btn-sits-create').attr('disabled', 'disabled');
            },

            onCreateClick: function () {
                // to be implemeted
                //Communicator.mediator.trigger('dialog:open:download', true);
            },

            onTimeChange: function (time) {
                this.$('#div-date-begin input[type="text"]').datepicker(
                    'update', this.model.get('ToI').start
                );
                this.$('#div-date-end input[type="text"]').datepicker(
                    'update', this.model.get('ToI').end
                );
            },

            onCloseTimeWidget: function (evt) {
                var opt = {
                    start: this.$('#div-date-begin input[type="text"]').datepicker('getDate'),
                    end: this.$('#div-date-end input[type="text"]').datepicker('getDate')
                };
                Communicator.mediator.trigger('date:selection:change', opt);
            },

            onSelectionChange: function (obj) {
                if (obj) {
                    $('#txt-minx').val(obj.bounds.left);
                    $('#txt-maxx').val(obj.bounds.right);
                    $('#txt-miny').val(obj.bounds.bottom);
                    $('#txt-maxy').val(obj.bounds.top);
                    this.$('#btn-sits-create').removeAttr('disabled');
                } else {
                    this.$('#btn-sits-create').attr('disabled', 'disabled');
                }
            },

            onBBoxChange: function (event) {
                var values = {
                    left: parseFloat($('#txt-minx').val()),
                    right: parseFloat($('#txt-maxx').val()),
                    bottom: parseFloat($('#txt-miny').val()),
                    top: parseFloat($('#txt-maxy').val())
                };
                this.$('#btn-sits-create').attr('disabled', 'disabled');
                if (!isNaN(values.left) && !isNaN(values.right) && !isNaN(values.bottom) && !isNaN(values.top)) {
                    if (!(values.left > values.right || values.bottom > values.top)) {
                        Communicator.mediator.trigger(
                            'selection:bbox:changed', values
                        );
                        this.$('#btn-sits-create').removeAttr('disabled');
                    }
                }
            },

            onClose: function () {
                this.close();
            }
        });

        return {SITSCreationView: SITSCreationView};
    };

    root.define(deps, init);

}).call(this);
