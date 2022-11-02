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
				addFilters: {
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
				},
				onPresAddNewOperations: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.Instead
				},
				onDragEnd: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.Instead
				},
				onDragStart: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.Instead
				}
			}
		},

		oOrderTable: null,
		oOrderOperationTable: null,
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
			this.getView().byId("idTableOrderTable").setModel(this.getModel("OrderOperation"));
			this.oOrderTable = this.getView().byId("idTableOrderTable");
			this.oOrderOperationTable = this.oOrderTable.getTable();
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
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.evorait.evosuite.evoorderrelate.view.OrderTable
		 */
		onExit: function () {

		},

		/**
		 * allows extension to add filters. They will be combined via AND with all other filters
		 * oControllerExtension must be the ControllerExtension instance which adds the filter
		 * oFilter must be an instance of sap.ui.model.Filter
		 */
		addFilters: function () {
			return [];
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Method to handle table selection and collect selected context
		 * @param {sap.ui.base.Event} oEvent - the press event
		 */
		onPresAddNewOperations: function (oEvent) {
			var aContext = this.oOrderOperationTable.getSelectedContexts("OrderOperation");

			if (!aContext || (aContext && aContext.length === 0)) {
				var sMsg = this.getResourceBundle().getText("msg.selectAtleastOneLineItem");
				this.showMessageToast(sMsg);
				return;
			}
			//get selected rows when checkboxes in table selected
			if (aContext.length > 0) {
				var eventBus = sap.ui.getCore().getEventBus();
				eventBus.publish("TemplateRendererNetworkOperation", "changedBinding", {
					data: aContext
				});
			}
			this.oOrderOperationTable.removeSelections();
		},

		/**
		 * Handles press event on the 'Filter' button in the Order Table toolbar
		 * Opens a Diaog containing FilterBar
		 * @param {sap.ui.base.Event} oEvent - the press event
		 */
		onOrderFilterOpen: function (oEvent) {
			this.pOrderFilterDialogLoaded.then(function (res) {
				this.oOrderFilterDialog.open();
			}.bind(this));
		},

		/**
		 * Handles press event on the 'Close' button in the Order Filter Dialog
		 * Closes the Diaog containing FilterBar
		 * @param {sap.ui.base.Event} oEvent - the press event
		 */
		onOrderFilterClose: function () {
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
			this._getDefaultTableFiltersFromUrlParams("OrderOperationsSet").then(function (aFilters) {
				this.aPageDefaultFilters = aFilters;
				this.oOrderTable.rebindTable();
			}.bind(this));
		},

		/**
		 * On DragStart set the dragSession selected demands
		 * @param {sap.ui.base.Event} oEvent - the drag event
		 */
		onDragStart: function (oEvent) {
			var sMsg = this.getResourceBundle().getText("msg.notAuthorizedForCreate");
			if (this.getModel("viewModel").getProperty("/authorizeCheck") && !this.getModel("user").getProperty("/ENABLE_IW32_AUTH_CHECK")) {
				this.showMessageToast(sMsg);
				oEvent.preventDefault();
				return;
			}
			var oDragSession = oEvent.getParameter("dragSession"),
				oDraggedControl = oDragSession.getDragControl(),
				aContext = this.oOrderOperationTable.getSelectedContexts("OrderOperation"),
				aSelectedContext;

			oDragSession.setTextData("Hi I am dragging");
			//get selected rows when checkboxes in table selected
			if (aContext.length > 0) {
				aSelectedContext = aContext;
			} else {
				//table tr single dragged element
				aSelectedContext = [oDraggedControl.getBindingContext()];
			}

			// keeping the data in drag session
			this.getModel("viewModel").setProperty("/dragSession", aSelectedContext);
			if (!aSelectedContext || (aSelectedContext && aSelectedContext.length === 0)) {
				oEvent.preventDefault();
			}
		},
		/**
		 * On Drag end check for dropped control, If dropped control not found
		 * then make reset the selection
		 * @param {sap.ui.base.Event} oEvent - the drag event
		 */
		onDragEnd: function (oEvent) {
			this._deselectAll();
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
		 * @Private
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
		 * @Private
		 */
		_getObjectEntries: function (obj) {
			var aEntries = Object.keys(obj),
				aResArray = [];
			aEntries.forEach(function (avalue) {
				aResArray.push([avalue, obj[avalue][0]]);
			});
			return aResArray;
		},

		/**
		 * deselect all checkboxes in table
		 * @Private
		 */
		_deselectAll: function () {
			this.oOrderOperationTable.removeSelections();
		}
	});

});