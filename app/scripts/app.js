//------------------------------------------------------------------------------
//
// Project: DAMATS Client
// Authors: Daniel Santillan <daniel.santillan@eox.at>
//
//------------------------------------------------------------------------------
// Copyright (C) 2014 EOX IT Services GmbH
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
        'regions/DialogRegion',
        'regions/UIRegion',
        'layouts/LayerControlLayout',
        'layouts/ToolControlLayout',
        'jquery',
        'backbone.marionette',
        'controller/ContentController',
        'controller/SelectionManagerController',
        'controller/LoadingController',
        'modules/damats/DataController',
        'modules/damats/ObjectMetadataEditorController',
        'modules/damats/SITSManagerController',
        'modules/damats/SITSCreationController',
        'modules/damats/SITSRemovalController',
        'modules/damats/SITSBrowserController',
        'modules/damats/SITSEditorController',
        'modules/damats/ProcessListController',
        'modules/damats/JobsManagerController',
        'modules/damats/JobRemovalController',
        'modules/damats/JobViewerController',
        'modules/damats/JobCreationController',
        'modules/damats/UserProfileController',
        'modules/damats/MapController',
        'modules/damats/ClassStatisticsController',
        'router'
    ];

    function init(Backbone, Communicator, globals, DialogRegion,
                  UIRegion, LayerControlLayout, ToolControlLayout) {

        var Application = Backbone.Marionette.Application.extend({

            initialize: function (options) {
                // clear permanent local storage
                localStorage.clear();
            },

            configure: function (config) {

                // Load jquery ui tooltip tool
                $('body').tooltip({
                    selector: '[data-toggle=tooltip]',
                    position: { my: 'left+5 center', at: 'right center' },
                    hide: { effect: false, duration: 0 },
                    show: { effect: false, delay: 700}
                });

                var views = {};
                var models = {};
                var templates = {};

                // Application regions are loaded and added
                // to the Marionette Application
                _.each(config.regions, function (region) {
                    var obj = {};
                    obj[region.name] = '#' + region.name;
                    this.addRegions(obj);
                    console.log('Added region ' + obj[region.name]);
                }, this);

                // Load all configured views.
                _.each(config.views, function (item) {
                    $.extend(views, require(item));
                }, this);

                // Load all configured models.
                _.each(config.models, function (item) {
                    $.extend(models, require(item));
                }, this);

                // Load all configured templates.
                _.each(config.templates, function (item) {
                    templates[item.id] = require(item.template);
                }, this);

                // Map attributes are loaded and added to the global map model.
                globals.objects.add(
                    'mapmodel', models.parseMapConfig(config.mapConfig)
                );

                // Base layers are loaded and added to the global collection.
                _.each(config.mapConfig.baseLayers, function (item) {
                    globals.baseLayers.add(models.parseBaseLayer(item));
                    console.log('Adding base-layer: ' + item.id);
                }, this);

                //Overlays are loaded and added to the global collection
                _.each(config.mapConfig.overlays, function (item) {
                    globals.overlays.add(models.parseOverlayLayer(item));
                    console.log('Adding overlay-layer ' + item.id);
                }, this);

                //Data layers are loaded and added to the global collection
                _.each(config.mapConfig.products, function (item) {
                    globals.products.add(models.parseProductLayer(item));
                    console.log('Added data-layer ' + item.view.id );
                }, this);

                // Create and displaye map view.
                this.map.show(new views.MapView({el: $('#map')}));

                // DAMATS specific URL configuration and data loading
                globals.damats.productTemplate = config.damats.productTemplate;
                globals.damats.productUrl = (
                    config.damats.url + config.damats.pathOWS
                );
                globals.damats.processUrl = (
                    config.damats.url + config.damats.pathOWS
                );
                globals.damats.getProduct = function (id, description, has_time_slider) {
                    // start with a deep copy of the template
                    var obj = $.extend(true, {}, globals.damats.productTemplate);
                    obj.description = description || null;
                    obj.name = id;
                    obj.download.id = id;
                    obj.download.url = globals.damats.productUrl;
                    obj.info.id = id;
                    obj.info.url = globals.damats.productUrl;
                    obj.view.id = id;
                    obj.view.urls = [globals.damats.productUrl];
                    obj.timeSlider = has_time_slider || false;
                    return models.parseProductLayer(obj);
                };
                globals.damats.user.url = (
                    config.damats.url + config.damats.pathUser
                );
                globals.damats.groups.url = (
                    config.damats.url + config.damats.pathGroups
                );
                globals.damats.sources.url = (
                    config.damats.url + config.damats.pathSources
                );
                globals.damats.processes.url = (
                    config.damats.url + config.damats.pathProcesses
                );
                globals.damats.time_series.url = (
                    config.damats.url + config.damats.pathTimeSeries
                );
                globals.damats.jobs.url = (
                    config.damats.url + config.damats.pathJobs
                );
                globals.damats.fetchAll();


                // If Navigation Bar is set in configuration go through the
                // defined elements creating a item collection to rendered
                // by the marionette collection view
                if (config.navBarConfig) {

                    var navBarItemCollection = new models.NavBarCollection;

                    _.each(config.navBarConfig.items, function (list_item) {
                        navBarItemCollection.add(
                            new models.NavBarItemModel({
                                name: list_item.name,
                                icon: list_item.icon,
                                eventToRaise: list_item.eventToRaise
                            }));
                    }, this);

                    this.topBar.show(new views.NavBarCollectionView({
                        template: templates.NavBar({
                            title: config.navBarConfig.title,
                            url: config.navBarConfig.url
                        }),
                        className: 'navbar navbar-inverse navbar-fixed-top not-selectable',
                        itemView: views.NavBarItemView,
                        tag: 'div',
                        collection: navBarItemCollection
                    }));

                }

                // Added region to test combination of backbone
                // functionality combined with jQuery UI
                this.addRegions({
                    dialogRegion: DialogRegion.extend({el: '#dialogRegion'})
                });
                this.DialogContentView = new views.ContentView({
                    template: {type: 'handlebars', template: templates.Info},
                    id: 'about',
                    className: 'modal fade',
                    attributes: {
                        role: 'dialog',
                        tabindex: '-1',
                        'aria-labelledby': 'about-title',
                        'aria-hidden': true,
                        'data-keyboard': true,
                        'data-backdrop': 'static'
                    }
                });

                // Create the views - these are Marionette.CollectionViews
                // that render ItemViews
                this.baseLayerView = new views.BaseLayerSelectionView({
                    collection: globals.baseLayers,
                    itemView: views.LayerItemView.extend({
                        template: {
                            type: 'handlebars',
                            template: templates.BulletLayer
                        },
                        className: 'radio'
                    })
                });

                this.productsView = new views.LayerSelectionView({
                    collection: globals.products,
                    itemView: views.LayerItemView.extend({
                        template: {
                            type: 'handlebars',
                            template: templates.CheckBoxLayer
                        },
                        className: 'sortable-layer'
                    }),
                    className: 'sortable'
                });

                this.overlaysView = new views.BaseLayerSelectionView({
                    collection: globals.overlays,
                    itemView: views.LayerItemView.extend({
                        template: {
                            type: 'handlebars',
                            template: templates.CheckBoxOverlayLayer
                        },
                        className: 'checkbox'
                    }),
                    className: 'check'
                });

                // Create layout that will hold the child views
                this.layout = new LayerControlLayout();


                // Define collection of selection tools
                var selectionToolsCollection = new models.ToolCollection();
                _.each(config.selectionTools, function (selTool) {
                    selectionToolsCollection.add(
                            new models.ToolModel({
                                id: selTool.id,
                                description: selTool.description,
                                icon: selTool.icon,
                                enabled: true,
                                active: false,
                                type: 'selection'
                            }));
                }, this);

                // Define collection of visualization tools
                var visualizationToolsCollection = new models.ToolCollection();
                _.each(config.visualizationTools, function (visTool) {
                    visualizationToolsCollection.add(new models.ToolModel({
                        id: visTool.id,
                        eventToRaise: visTool.eventToRaise,
                        description: visTool.description,
                        disabledDescription: visTool.disabledDescription,
                        icon: visTool.icon,
                        enabled: visTool.enabled,
                        active: visTool.active,
                        type: 'tool'
                    }));
                }, this);

                // Create Collection Views to hold set of views
                // for selection tools
                this.visualizationToolsView = new views.ToolSelectionView({
                    collection: visualizationToolsCollection,
                    itemView: views.ToolItemView.extend({
                        template: {
                            type: 'handlebars',
                            template: templates.ToolIcon
                        }
                    })
                });

                // Create Collection Views to hold set of views
                // for visualization tools
                this.selectionToolsView = new views.ToolSelectionView({
                    collection: selectionToolsCollection,
                    itemView: views.ToolItemView.extend({
                        template: {
                            type: 'handlebars',
                            template: templates.ToolIcon
                        }
                    })
                });


                // Create layout to hold collection views
                this.toolLayout = new ToolControlLayout();

                this.timeSliderView = new views.TimeSliderView(config.timeSlider);
                this.bottomBar.show(this.timeSliderView);

                // Add a trigger for ajax calls in order to display loading
                // state in mouse cursor to give feedback to the user the client
                // if busy.
                $(document).ajaxStart(function () {
                  Communicator.mediator.trigger('progress:change', true);
                });

                $(document).ajaxStop(function () {
                  Communicator.mediator.trigger('progress:change', false);
                });

                $(document).ajaxError(function (event, request, settings) {
                    if (settings.suppressErrors) {
                        return;
                    }

                    var statuscode = '';
                    if (request.status != 0)
                        statuscode =  '<br>Status Code: ' + request.status;
                    $('#error-messages').append(
                        '<div class="alert alert-warning alert-danger">' +
                          '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>' +
                          '<strong><i class="fa fa-fw fa-exclamation-triangle"></i>&nbsp;ERROR: ' +
                          'HTTP/' + settings.type + ' request failed!</strong>' +
                          '<br>URL:&nbsp;' + settings.url.split('?')[0] + statuscode +
                        '</div>'
                    );
                });

                // Go through Navigation Bar items and for each throw
                // an activation event
                // elements that are marked with show == true
                if (config.navBarConfig) {
                    _.each(config.navBarConfig.items, function (list_item) {
                        if (list_item.show) {
                            Communicator.mediator.trigger(list_item.eventToRaise);
                        }
                    }, this);
                }

                // Remove loading screen at the end of the initialisation.
                $('#loadscreen').remove();
            }
        });

        return new Application();
    }

    root.define(deps, init);
}).call(this);
