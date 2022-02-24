sap.ui.define([
	"com/evorait/evosuite/evomanagedepend/controller/BaseController",
	"sap/ui/core/Fragment"
], function (BaseController, Fragment) {
	"use strict";

	return BaseController.extend("com.evorait.evosuite.evomanagedepend.controller.App", {
		
		onInit: function () {
			//Bind the message model to the view and register it
			this.getOwnerComponent().registerViewToMessageManager(this.getView());
			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		},

		/**
		 * Initialize and open the Information dialog with necessary details
		 * @param oEvent Button press event
		 */
		onIconPress: function (oEvent) {
			// create popover
			if (!this._infoDialog) {
				Fragment.load({
					name: "com.evorait.evosuite.evomanagedepend.view.fragments.InformationPopover",
					controller: this
				}).then(function (oDialog) {
					this._infoDialog = oDialog;
					this.open(oDialog);
				}.bind(this));
			} else {
				this.open(this._infoDialog);
			}
		},

		open: function (oDialog) {
			var oView = this.getView();
			oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
			oView.addDependent(oDialog);
			oDialog.open();
		},

		/**
		 * Closes the information dialog
		 */
		onCloseDialog: function () {
			this._infoDialog.close();
		},

		/**
		 * Open Message Manager on click
		 * @param oEvent
		 */
		onMessageManagerPress: function (oEvent) {
			this.openMessageManager(this.getView(), oEvent);
		}
	});
});