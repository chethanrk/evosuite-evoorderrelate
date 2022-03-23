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

				saveChanges: {
					public: true,
					final: true
				},

				refreshGanttModel: {
					public: true,
					final: true
				}
			}
		},

		formatter: formatter,

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
		 * @param sEntitySet   --- EntitySet name 
		 * @param {oPayload}     --- Payload data to save updated network
		 */
		saveChanges: function (oPayload) {
			this.oViewModel.setProperty("/gantBusy", true);
			this.getOwnerComponent().postData("/WONetworkHeaderSet", oPayload).then(function (oResult) {
				if (oResult && oResult.NETWORK_KEY) {
					this.oUpdatedBackupData = deepClone(oResult);
					this.refreshGanttModel(oResult, true);
				}
				this.getModel().refresh();
				this.oViewModel.setProperty("/gantBusy", false);
			}.bind(this), function (error) {
				this.oViewModel.setProperty("/gantBusy", false);
				var oBackupData = deepClone(this.oUpdatedBackupData);
				this.refreshGanttModel(oBackupData);
			}.bind(this));
		},

		/**
		 * delete request
		 */
		deleteNetwork: function (sNetworkKey) {
			//TODO delete network backend call
			sap.m.MessageToast.show("Deleted");
		},

		/**
		 *  validation request 
		 */
		validateNetworkOperations: function (oData) {
			//TODO delete network backend call
			sap.m.MessageToast.show("Backend validations");
			oData.VALIDATION_INDICATOR = true;
			this.saveChanges(oData);
		},

		/**
		 * Set new data to model and network operation count to the property
		 * Refresh if updating the json model with enw data
		 * @param {oData}  -- Gantt data
		 * @param bRefresh -- indicator to refresh model
		 */
		refreshGanttModel: function (oData, bRefresh) {
			this.getModel("ganttModel").setData(oData);
			if (bRefresh) {
				this.getModel("ganttModel").refresh();
			}
			if (oData.NetworkHeaderToOperations && oData.NetworkHeaderToOperations.results && oData.NetworkHeaderToOperations.results.length) {
				this.getModel("viewModel").setProperty("/GanttRowCount", oData.NetworkHeaderToOperations.results.length);
			} else {
				this.getModel("viewModel").setProperty("/GanttRowCount", 0);
			}
			this.oViewModel.setProperty("/pendingChanges", false);
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

	});

});