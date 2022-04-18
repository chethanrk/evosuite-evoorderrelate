sap.ui.define([
	"com/evorait/evosuite/evoorderrelate/controller/BaseController",
	"sap/ui/core/Fragment",
	"sap/ui/core/mvc/OverrideExecution",
	"com/evorait/evosuite/evoorderrelate/model/models",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"com/evorait/evosuite/evoorderrelate/model/formatter",
	"sap/ui/model/json/JSONModel"
], function (BaseController, Fragment, OverrideExecution, models, Filter, FilterOperator, MessageBox, formatter, JSONModel) {
	"use strict";
	return BaseController.extend("com.evorait.evosuite.evoorderrelate.controller.NewNetworkDialog", {

		metadata: {
			// extension can declare the public methods
			// in general methods that start with "_" are private
			methods: {
				open: {
					public: true,
					final: false
				},
				onNetworkValueHelpCancelPress: {
					public: true,
					final: false
				},
				onNetworkValueHelpOkPress: {
					public: true,
					final: false
				},
				onNetworkValueHelpAfterClose: {
					public: true,
					final: false
				},
				onPressCustomFilterSubmit: {
					public: true,
					final: false
				},
				onFilterBarSearch: {
					public: true,
					final: false
				}
			}
		},

		_oNetworkSelectionDialog: null,
		_oComponent: null,
		_oView: null,
		_oContext: null,
		_oVHDCustomInput: null,

		/**
		 * Open the doalig, add the dialog as dependent to the provided view.
		 * @param {sap.ui.core.mvc.View} oView - Parent view, where the dialog is opened
		 */
		open: function (oView, oSource, mCustomData, aValueListParameter) {
			// init internal properties
			this._oComponent = oView.getController().getOwnerComponent();
			this._oView = oView;
			this._oController = oView.getController();

			this._oVHDCustomInput = oSource;

			// lazy loading
			Fragment.load({
				name: "com.evorait.evosuite.evoorderrelate.view.fragments.NetworkValueHelpDialog",
				type: "XML",
				controller: this
			}).then(function (oDialog) {
				this._oNetworkSelectionDialog = oDialog;
				this._oNetworkSelectionDialog.addStyleClass(this._oComponent.getContentDensityClass());
				oView.addDependent(oDialog);

				//Bind table and filters
				this._bindVHDTableWithSet(mCustomData, this._oNetworkSelectionDialog, aValueListParameter);

				this._oNetworkSelectionDialog.open();
			}.bind(this));

		},

		/**
		 * Handle `press` event on 'Close' button
		 * Close the dialog
		 * @param {sap.ui.base.Event} oEvent - the `press` event
		 */
		onNetworkValueHelpCancelPress: function (oEvent) {
			this._oNetworkSelectionDialog.close();
		},

		/**
		 * Handle `press` event on 'ok' button
		 * Close the dialog
		 * @param {sap.ui.base.Event} oEvent - the `press` event
		 */
		onNetworkValueHelpOkPress: function (oEvent) {
			var aTokens = oEvent.getParameter("tokens"),
				sValue = aTokens[0].getKey();

			this._oVHDCustomInput.setValue(sValue);
			this._oVHDCustomInput.fireChange({
				value: sValue
			});

			this._oNetworkSelectionDialog.close();
		},

		/**
		 * after closing custom ValueHelper
		 * @param oEvent
		 */
		onNetworkValueHelpAfterClose: function (oEvent) {
			this._oNetworkSelectionDialog.destroy(true);
			this._oNetworkSelectionDialog = null;
		},

		/**
		 * Handle on submit event on custom filter input in VHD
		 */
		onPressCustomFilterSubmit: function () {
			this._oNetworkSelectionDialog.getFilterBar().fireSearch();
		},

		/**
		 * Search function inside VHD
		 */
		onFilterBarSearch: function (oEvent) {
			var aSelectionSet = oEvent.getParameter("selectionSet"),
				aFilters = [];
			if (!aSelectionSet) {
				aSelectionSet = [];
				var aItems = this._oNetworkSelectionDialog.getFilterBar().getFilterGroupItems();
				aItems.forEach(function (aItem) {
					aSelectionSet.push(aItem.getControl());
				});
			}
			aFilters = this._filterVHDValues(aSelectionSet);
			this._filterTable(aFilters);
		},

		/* =========================================================== */
		/* internal methods                                              */
		/* =========================================================== */

		/**
		 * in custom ValueHelper table is bind with VHSet from customData
		 * @param {mCustomData} -- custom object
		 * @param {oValueHelpDialog} -- value help dialog
		 * @param [aValueListParameter] -- value list annotation properties
		 */
		_bindVHDTableWithSet: function (mCustomData, oValueHelpDialog, aValueListParameter) {
			var oFilterBarItem = [],
				aCols = [];

			aValueListParameter.forEach(function (aParameter) {
				var sValueListProperty = aParameter.ValueListProperty["String"],
					sRecordType = aParameter.RecordType;

				//set key and descriptoin to the VHD
				this._setVHDKeyAndDescription(mCustomData, sValueListProperty, oValueHelpDialog, sRecordType);
				//get filter filds to VHD
				oFilterBarItem.push(this._getFiltersItemToVHD(sValueListProperty, mCustomData));

				//Array of columns based on valuHelp parameter
				aCols.push({
					template: sValueListProperty,
					label: "{/" + mCustomData.vhSet + "/" + sValueListProperty +
						"/##com.sap.vocabularies.Common.v1.Label/String}"
				});
			}.bind(this));

			//Set filterbar to VHD
			oValueHelpDialog.setFilterBar(this._getFilterToVHD(oFilterBarItem));

			//Set table to VHD
			this._setTableToVHD(mCustomData, aCols);
		},

		/**
		 * Set key and description to the VHD
		 * @param {mCustomData}  -- custom data
		 * @param sValueListProperty -- value list prperty name
		 * @param {oValueHelpDialog} -- value help dialog
		 * @param sRecordType  -- annotation type
		 */
		_setVHDKeyAndDescription: function (mCustomData, sValueListProperty, oValueHelpDialog, sRecordType) {
			if (sValueListProperty === mCustomData.property) {
				oValueHelpDialog.setKey(sValueListProperty);
			} else if (sRecordType === "com.sap.vocabularies.Common.v1.ValueListParameterDisplayOnly") {
				oValueHelpDialog.setDescriptionKey(sValueListProperty);
			}
		},

		/**
		 * add filter group to the VHD
		 * @param sValueListProperty - property name
		 * @param{mCustomData} -- custom data 
		 */
		_getFiltersItemToVHD: function (sValueListProperty, mCustomData) {
			return new sap.ui.comp.filterbar.FilterGroupItem({
				groupName: sValueListProperty,
				name: sValueListProperty,
				label: "{/" + mCustomData.vhSet + "/" + sValueListProperty +
					"/##com.sap.vocabularies.Common.v1.Label/String}",
				control: new sap.m.Input({
					name: sValueListProperty,
					enabled: true,
					submit: this.onPressCustomFilterSubmit.bind(this)
				})
			});
		},

		/**
		 * returns filterbar for VHD
		 * @param {oFilterBarItem} -- filterbar item
		 */
		_getFilterToVHD: function (oFilterBarItem) {
			return new sap.ui.comp.filterbar.FilterBar({
				advancedMode: true,
				filterGroupItems: oFilterBarItem,
				search: this.onFilterBarSearch.bind(this)
			});
		},

		/**
		 * filter for VHD
		 * @param [aSelectionSet] - filter list inside VHD
		 */
		_filterVHDValues: function (aSelectionSet) {
			var aVHDFiltersAND = [];
			aSelectionSet.forEach(function (oControl) {
				var sValue = oControl.getValue();
				if (sValue !== "") {
					aVHDFiltersAND.push(new Filter({
						path: oControl.getName(),
						operator: FilterOperator.Contains,
						value1: sValue
					}));
				}
			});
			var aFilters = new Filter([], true);

			if (aVHDFiltersAND.length) {
				aFilters.aFilters.push(new Filter(aVHDFiltersAND, true));
			}
			return aFilters;
		},

		/**
		 * Reibnd the table inside VHD based on filters
		 * @param {oFilter} -filters object
		 */
		_filterTable: function (oFilter) {
			this._oNetworkSelectionDialog.getTableAsync().then(function (oTable) {
				oTable.setBusy(true);
				if (oTable.bindRows) {
					if (oFilter.aFilters.length > 0) {
						oTable.getBinding("rows").filter(oFilter);
					} else {
						oTable.getBinding("rows").filter();
					}
				}

				setTimeout(function () {
					if (this._oNetworkSelectionDialog) {
						this._oNetworkSelectionDialog.update();
					}
					oTable.setBusy(false);
				}.bind(this), 4000);

			}.bind(this));
		},

		/**
		 * add table to the VHD
		 * @param {mCustomData} -- Custon data object
		 * @param [aCols] -- columns details
		 */
		_setTableToVHD: function (mCustomData, aCols) {
			this._oNetworkSelectionDialog.getTableAsync().then(function (oTable) {
				oTable.setModel(this._oView.getModel());
				oTable.setBusy(true);
				oTable.setModel(new JSONModel({
					cols: aCols
				}), "columns");
				if (oTable.bindRows) {
					oTable.bindAggregation("rows", "/" + mCustomData.vhSet);
				}
				var oBinding = oTable.getBinding("rows");
				oBinding.attachChange(function (sReason) {
					var oResourceBundle = this._oView.getModel("i18n").getResourceBundle(),
						sHeader = oResourceBundle.getText("tit.items", oBinding.getLength());
					var sText = new sap.m.Text({
						text: sHeader
					});
					this._oNetworkSelectionDialog.getTable().setTitle(sText);
				}.bind(this));
				this._oNetworkSelectionDialog.update();
				oTable.setBusy(false);

			}.bind(this));
		},

		/**
		 * Set values to the filter item
		 * @param [aFilterItems] -- filter item details
		 * @param sProperty - property name
		 */
		_setFilterItemToDefaultValues: function (aFilterItems, sProperty) {
			var oSmartFilterBar = this._oFilterBarLocation;
			aFilterItems.forEach(function (aItem) {
				var sFilterItem = aItem;
				//Set already selcted values & disable filter selection inside VHD
				if (sFilterItem.getControl().getName() !== sProperty) {
					var oCustomControl = oSmartFilterBar.getControlByKey(sFilterItem.getControl().getName());
					if (oCustomControl.data().property) {
						if (oCustomControl instanceof sap.m.Input && oCustomControl.getValue() !== "") {
							sFilterItem.getControl().setValue([oCustomControl.getValue()]);
						}
					}
				}
			}.bind(this));
		}
	});
});