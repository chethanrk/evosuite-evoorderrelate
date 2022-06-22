/*global history */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Text",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/core/mvc/OverrideExecution",
	"com/evorait/evosuite/evoorderrelate/model/formatter",
	"sap/base/util/deepClone"
], function (Controller, History, Dialog, Button, Text, MessageToast, MessageBox, OverrideExecution, formatter, deepClone) {
	"use strict";

	return Controller.extend("com.evorait.evosuite.evoorderrelate.controller.BaseController", {

		metadata: {
			// extension can declare the public methods
			// in general methods that start with "_" are private
			methods: {

				formatter: {
					public: true,
					final: true
				},

				getRouter: {
					public: true,
					final: true
				},

				getModel: {
					public: true,
					final: true
				},

				setModel: {
					public: true,
					final: true
				},

				getResourceBundle: {
					public: true,
					final: true
				},

				clearAllMessages: {
					public: true,
					final: true
				},

				openMessageManager: {
					public: true,
					final: true
				},

				showMessageToast: {
					public: true,
					final: true
				},

				showConfirmDialog: {
					public: true,
					final: true
				},

				saveNetworkChanges: {
					public: true,
					final: true
				},

				refreshGanttModel: {
					public: true,
					final: true
				},

				adddependencies: {
					public: true,
					final: true
				}
			}
		},

		formatter: formatter,
		oBackupData: {},
		oUpdatedBackupData: {},

		/**
		 * Convenience method for accessing the router in every controller of the application.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return this.getOwnerComponent().getRouter();
		},

		/**
		 * Convenience method for getting the view model by name in every controller of the application.
		 * @public
		 * @param {string} sName the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			if (this.getOwnerComponent()) {
				return this.getOwnerComponent().getModel(sName);
			}
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model in every controller of the application.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Convenience method for getting the resource bundle.
		 * @public
		 * @vesrion 2.0
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Clear all message present in the MessageManager
		 */
		clearAllMessages: function () {
			// does not remove the manually set ValueStateText we set in onValueStatePress():
			sap.ui.getCore().getMessageManager().removeAllMessages();
		},

		/**
		 * On click, open Message Popover
		 * @param oView  -- view which message popover open
		 * @param oEvent  -- button press event
		 */
		openMessageManager: function (oView, oEvent) {
			this.getOwnerComponent().MessageManager.open(oView, oEvent);
		},

		/**
		 * show a message toast for 5 seconds
		 * @param msg
		 */
		showMessageToast: function (msg) {
			sap.m.MessageToast.show(msg, {
				duration: 5000, // default
				my: "center center", // default
				at: "center center", // default
				of: window, // default
				offset: "0 0", // default
				collision: "fit fit", // default
				onClose: null, // default
				autoClose: true, // default
				animationTimingFunction: "ease", // default
				animationDuration: 1000, // default
				closeOnBrowserNavigation: true // default
			});
		},

		/**
		 * show confirm dialog where user needs confirm some action
		 * @param sTitle
		 * @param sMsg
		 * @param successCallback
		 * @param cancelCallback
		 */
		showConfirmDialog: function (sTitle, sMsg, successCallback, cancelCallback, sState) {
			var dialog = new sap.m.Dialog({
				title: sTitle,
				type: "Message",
				state: sState || "None",
				content: new sap.m.Text({
					text: sMsg
				}),
				beginButton: new sap.m.Button({
					text: this.getResourceBundle().getText("btn.confirm"),
					press: function () {
						dialog.close();
						if (successCallback) {
							successCallback();
						}
					}.bind(this)
				}),
				endButton: new sap.m.Button({
					text: this.getResourceBundle().getText("btn.no"),
					press: function () {
						if (cancelCallback) {
							cancelCallback();
						}
						dialog.close();
					}.bind(this)
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.addStyleClass(this.getModel("viewModel").getProperty("/densityClass"));
			dialog.open();
		},

		/**
		 * Validate the gantt table selection
		 * @parm iSelectedIndex - selected index of gantt table
		 * @param sPosition - manual sort position
		 * @param iGanttRowCount - gantt row count
		 * @ return param boolean
		 */
		selectionValidation: function (iSelectedIndex, sPosition, iGanttRowCount) {
			if (!this._selectedRowIndex || this._selectedRowIndex === 0) {
				var sMsg = this.getResourceBundle().getText("msg.selectAtleastOneLineItem");
				this.showMessageToast(sMsg);
				return true;
			}

			if (sPosition && sPosition === "Up" && this._selectedRowIndex < 2) {
				return true;
			}

			if (sPosition && sPosition === "Down" && iGanttRowCount && this._selectedRowIndex > (iGanttRowCount - 2)) {
				return true;
			}

			return false;
		},

		/**
		 * Save changes method to handle post request
		 * @param {oPayload}     --- Payload data to save updated network
		 * @param successCallback  --- success callback function
		 * @param errorCallback  --- error callback function
		 */
		saveNetworkChanges: function (oPayload, successCallback, errorCallback) {
			this.oViewModel.setProperty("/gantBusy", true);
			this.getOwnerComponent().postData("/WONetworkHeaderSet", oPayload).then(function (oResult) {
				if (successCallback) {
					successCallback(oResult);
				}

				this.oViewModel.setProperty("/gantBusy", false);
			}.bind(this), function (error) {
				if (errorCallback) {
					errorCallback(error);
				}
				this.oViewModel.setProperty("/gantBusy", false);
			}.bind(this));
		},

		/**
		 * delete request
		 */
		deleteNetwork: function (oData) {
			oData.DELETE_INDICATOR = true;
			this.saveNetworkChanges(oData, this._deleteSuccess.bind(this), this._validationFail.bind(this));
		},

		/**
		 *  validation request 
		 */
		validateNetworkOperations: function (oData) {
			oData.VALIDATION_INDICATOR = true;
			this.saveNetworkChanges(oData, this._validationSuccess.bind(this), this._validationFail.bind(this));
		},

		/**
		 * Set new data to model and network operation count to the property
		 * Refresh if updating the json model with enw data
		 * @param {oData}  -- Gantt data
		 */
		refreshGanttModel: function (oData) {
			this.getModel("ganttModel").setData(oData);
			if (oData.NetworkHeaderToOperations && oData.NetworkHeaderToOperations.results && oData.NetworkHeaderToOperations.results.length) {
				this.getModel("viewModel").setProperty("/GanttRowCount", oData.NetworkHeaderToOperations.results.length);
			} else {
				this.getModel("viewModel").setProperty("/GanttRowCount", 0);
			}
		},

		/**
		 * picks out the change response data from a batch call
		 * Need for create/save entries 
		 * Example: CreateOrder _saveCreateSuccessFn
		 * @param oResponse
		 */
		getBatchChangeResponse: function (oResponse) {
			var batch = oResponse.__batchResponses[0];
			//success
			if (batch.__changeResponses) {
				if (batch.__changeResponses[0].data) {
					return batch.__changeResponses[0].data;
				}
			}
			return null;
		},

		/**
		 * Add dependencies when it is dragged from order operation and 
		 * adjust the dependency when operation dragged inside gantt table
		 * @param {oRowDraggedContext}  DraggedRow Context
		 * @param {oRowDroppedData} Dropped Row data
		 */
		adddependencies: function (oRowDraggedContext, oRowDroppedData) {
			return new Promise(function (resolve) {
				var obj = {},
					oDataPrepared = [];
				//collect all assignment properties who allowed for create
				this.getModel().getMetaModel().loaded().then(function () {
					var oMetaModel = this.getModel().getMetaModel(),
						oEntitySet = oMetaModel.getODataEntitySet("WONetworkOperationsSet"),
						oEntityType = oEntitySet ? oMetaModel.getODataEntityType(oEntitySet.entityType) : null,
						aProperty = oEntityType ? oEntityType.property : [];
					oRowDraggedContext.forEach(function (oContext) {
						var oRowDraggedData = oContext.getObject();
						aProperty.forEach(function (property) {
							if (oRowDraggedData[property.name]) {
								obj[property.name] = oRowDraggedData[property.name];
							}
						}.bind(this));
						obj.ObjectKey = "";
						obj.SORT_ID = "";
						obj.NETWORK_KEY = oRowDroppedData.NETWORK_KEY;
						obj.SCHEDULE_TYPE = oRowDroppedData.SCHEDULE_TYPE;
						obj.AOB_KEY = oRowDroppedData.AOB_KEY;
						obj.NetworkOperationsToGantt = {
							"results": []
						};
						oDataPrepared.push(deepClone(obj));
					}.bind(this));

					resolve(oDataPrepared);
				}.bind(this));
			}.bind(this));
		},

		/**
		 * Actions after validation success
		 * @param {oResult} - after validation returned new result
		 */
		_validationSuccess: function (oResult) {
			if (oResult && oResult.NETWORK_KEY) {
				this._removeRelationship(oResult);
				this.oUpdatedBackupData = deepClone(oResult);
				this.refreshGanttModel(oResult);
				this.oViewModel.setProperty("/pendingChanges", true);
			} else {
				this.oUpdatedBackupData = deepClone(this.oBackupData);
				this.refreshGanttModel(deepClone(this.oBackupData));
				this.oViewModel.setProperty("/pendingChanges", false);
			}
		},

		/**
		 * Actions after validation/delete fail
		 * set the previous changes to the gantt
		 */
		_validationFail: function () {
			var oBackupData = deepClone(this.oUpdatedBackupData);
			this.refreshGanttModel(oBackupData);
		},

		/**
		 * Actions after validation success
		 * @param {oResult} - after validation returned new result
		 */
		_deleteSuccess: function (oResult) {
			this.oViewModel.setProperty("/pendingChanges", false);
			var msg = this.getResourceBundle().getText("msg.saveSuccess");
			this.showMessageToast(msg);
			this.getModel().refresh();
			this.oNetworkSelection.resetProperty("value");
			this.refreshGanttModel({});
		},

		/**
		 * Remove last shape relationship values after succcessfull validation
		 * @param{oResult} ---oResult which returns fom the validation request
		 */
		_removeRelationship: function (oResult) {
			if (oResult.NetworkHeaderToOperations && oResult.NetworkHeaderToOperations.results && oResult.NetworkHeaderToOperations.results.length) {
				var oLastshpe = oResult.NetworkHeaderToOperations.results[oResult.NetworkHeaderToOperations.results.length - 1];
				if (oLastshpe && oLastshpe.NetworkOperationsToGantt && oLastshpe.NetworkOperationsToGantt.results && oLastshpe.NetworkOperationsToGantt
					.results.length) {
					oLastshpe.NetworkOperationsToGantt.results[0] = {};
				}
			}
		},

		/**
		 * Generate local object key for gantt operations to handle visibility of relationship in local
		 * @param sOrderNUm
		 * @param sOprNUm
		 * @param sSortId
		 */
		_getLocalObjectKey: function (sOrderNUm, sOprNUm, sSortId) {
			if (sOrderNUm && sOprNUm && sSortId) {
				return sOrderNUm + "_" + sOprNUm + "_" + sSortId + sSortId + sOrderNUm + sOprNUm;
			}
			return "";
		}
	});

});