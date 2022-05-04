sap.ui.define([
	"com/evorait/evosuite/evoorderrelate/controller/BaseController",
	"sap/ui/core/Fragment",
	"sap/ui/core/mvc/OverrideExecution"
], function (BaseController, Fragment, OverrideExecution) {
	"use strict";

	return BaseController.extend("com.evorait.evosuite.evoorderrelate.controller.App", {

		metadata: {
			// extension can declare the public methods
			// in general methods that start with "_" are private
			methods: {
				onIconPress: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.Instead
				},
				open: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.After
				},
				onCloseDialog: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.After
				},
				onMessageManagerPress: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.After
				}
			}
		},
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.evorait.evosuite.evoorderrelate.controller.App
		 */
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
					name: "com.evorait.evosuite.evoorderrelate.view.fragments.InformationPopover",
					controller: this
				}).then(function (oDialog) {
					this._infoDialog = oDialog;
					this.open(oDialog);
				}.bind(this));
			} else {
				this.open(this._infoDialog);
			}
		},

		/**
		 * Open information popover 
		 * @param {oDialog}  -- information dialog instance
		 */
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