sap.ui.define([
	"com/evorait/evosuite/evoorderrelate/controller/BaseController",
	"sap/ui/core/Fragment",
	"sap/ui/core/mvc/OverrideExecution"
], function (BaseController, Fragment, OverrideExecution) {
	"use strict";

	return BaseController.extend("com.evorait.evosuite.evoorderrelate.controller.OrderTable", {
		
		metadata: {
			// extension can declare the public methods
			// in general methods that start with "_" are private
			methods: {
				addFilters:{
					public: true,
					final: false,
					overrideExecution: OverrideExecution.Instead
				},
				onOrderFilterOpen: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.After
				},
				onOrderFilterClose: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.After
				},
				onBeforeRebindTable: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.After
				},
				onInitializedSmartVariant: {
					public: true,
					final: true
				}
			}
		},
		
		oOrderTable: null,
		oOrderFilterDialog: null,
		pOrderFilterDialogLoaded: null,
		aPageDefaultFilters: [],
		
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.evorait.evosuite.evoorderrelate.view.OrderTable
		 */
		onInit: function () {
			this.oOrderTable = this.getView().byId("idTableOrderTable");
			// initialise Order SmartFilterBar to make the Order table be able to subscribe to the SmartFilterBar's events
			this.pOrderFilterDialogLoaded = Fragment.load({
				name: "com.evorait.evosuite.evoorderrelate.view.fragments.OrderFilterDialog",
				controller: this,
				type: "XML"
			}).then(function (oFragment) {
				this.oOrderFilterDialog = oFragment;
				this.oOrderFilterDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
				this.getView().addDependent(oFragment);
			}.bind(this));
		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.evorait.evosuite.evoorderrelate.view.OrderTable
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.evorait.evosuite.evoorderrelate.view.OrderTable
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.evorait.evosuite.evoorderrelate.view.OrderTable
		 */
		//	onExit: function() {
		//
		//	}
		
		/**
		 * allows extension to add filters. They will be combined via AND with all other filters
		 * oControllerExtension must be the ControllerExtension instance which adds the filter
		 * oFilter must be an instance of sap.ui.model.Filter
		 */
		addFilters: function() {
			return [];	
		},
		
		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		
		/**
		 * Handles press event on the 'Filter' button in the Order Table toolbar
		 * Opens a Diaog containing FilterBar
		 * @param {sap.ui.base.Event} oEvent - the press event
		 */
		onOrderFilterOpen: function (oEvent) {
			this.pOrderFilterDialogLoaded.then(function(res) {
				this.oOrderFilterDialog.open();
			}.bind(this));
		},
		
		/**
		 * Handles press event on the 'Close' button in the Order Filter Dialog
		 * Closes the Diaog containing FilterBar
		 * @param {sap.ui.base.Event} oEvent - the press event
		 */
		onOrderFilterClose: function() {
			this.oOrderFilterDialog.close();
		},
		
		/**
		 * SmartTable before loading request
		 * set default SortOrder from annotations
		 * @param {sap.ui.base.Event} oEvent - the beforeRebindTable event
		 */
		onBeforeRebindTable: function (oEvent) {
			var mBindingParams = oEvent.getParameter("bindingParams");
			this.aPageDefaultFilters = this.aPageDefaultFilters.concat(this.addFilters());
			mBindingParams.filters = mBindingParams.filters.concat(this.aPageDefaultFilters);
		},
		
		/**
		 * Common handler for event when Variant management of SmartFilterBar or SmartTable was initialized
		 * @param {sap.ui.base.Event} oEvent - the afterVariantInitialise event
		 */
		onInitializedSmartVariant: function (oEvent) {
			//get default filter by GET url parameter and if property is allowed to filter
			this._getDefaultTableFiltersFromUrlParams("WOHeaderSet").then(function (aFilters) {
				this.aPageDefaultFilters = aFilters;
				this.oOrderTable.rebindTable();
			}.bind(this));
		},
		
		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */
		
		/**
		 * collect all GET Url parameters
		 * and checks against entitySet if a porperty with parameter name exists
		 * when property exist is is allowed to filter create new filters
		 * returns Promise with array of filters
		 * @param sEntitySet
		 */
		_getDefaultTableFiltersFromUrlParams: function (sEntitySet) {
			return new Promise(function (resolve) {
				var urlParams = this.getOwnerComponent().getLinkParameterByName(),
					aFilters = [];

				this.getModel().getMetaModel().loaded().then(function () {
					if (urlParams.entries) {
						var entries = this._getObjectEntries(urlParams);
						entries.forEach(function (pair) {
							var oFilter = this._getFilterable(pair[0], pair[1], sEntitySet);
							if (oFilter) {
								aFilters.push(oFilter);
							}
						}.bind(this));
					} else if (typeof urlParams === "object") {
						for (var key in urlParams) {
							if (urlParams.hasOwnProperty(key) && urlParams[key]) {
								var oFilter = this._getFilterable(key, urlParams[key][0], sEntitySet);
								if (oFilter) {
									aFilters.push(oFilter);
								}
							}
						}
					}
					resolve(aFilters);
				}.bind(this));
			}.bind(this));
		},
		
		/**
		 * Alternate function for Object.entries()
		 * @{obj} selected object entry
		 * returns object which has array of key and value
		 */
		_getObjectEntries: function (obj) {
			var aEntries = Object.keys(obj),
				aResArray = [];
			aEntries.forEach(function (avalue) {
				aResArray.push([avalue, obj[avalue][0]]);
			});
			return aResArray;
		}
	});

});