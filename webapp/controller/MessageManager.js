sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Fragment",
	"sap/ui/core/mvc/OverrideExecution"
], function (Controller, Fragment, OverrideExecution) {
	"use strict";
	return Controller.extend("com.evorait.evosuite.evomanagedepend.controller.MessageManager", {

		metadata: {
			// extension can declare the public methods
			// in general methods that start with "_" are private
			methods: {

				open: {
					public: true,
					final: true
				},

				deleteAllMessages: {
					public: true,
					final: true
				},

				beforePopoverClose: {
					public: true,
					final: true
				}
			}
		},

		_showMessageManager: null,
		_oCurrentView: null,

		/**
		 * Open the Message Manager Popover
		 * @param oView
		 * @param oEvent
		 */
		open: function (oView, oEvent) {
			var oControlmsg = oEvent.getSource();
			this._oCurrentView = oView;
			if (!this._showMessageManager) {
				Fragment.load({
					name: "com.evorait.evosuite.evomanagedepend.view.fragments.MessageManager",
					controller: this,
					type: "XML"
				}).then(function (oFragment) {
					this._showMessageManager = oFragment;
					oView.addDependent(oFragment);
					this._showMessageManager.addStyleClass(oView.getModel("viewModel").getProperty("/densityClass"));
					this._showMessageManager.openBy(oControlmsg);
				}.bind(this));
			} else {
				if (this._showMessageManager.isOpen()) {
					this._showMessageManager.close();
				} else {
					this._refreshMessageModel();
					this._showMessageManager.openBy(oControlmsg);
				}
			}
		},

		/**
		 * Called when message model needs to refresh
		 */
		_refreshMessageModel: function () {
			if (this._showMessageManager.getModel("message")) {
				this._showMessageManager.getModel("message").refresh();
			} else if (this._oCurrentView.getModel("message")) {
				this._showMessageManager.setModel(this._oCurrentView.getModel("message"), "message");
				this._showMessageManager.getModel("message").refresh();
			}
		},

		/**
		 * Delete all messages from message manager model
		 */
		deleteAllMessages: function () {
			if (this._showMessageManager.getModel("message")) {
				this._showMessageManager.getModel("message").oMessageManager.removeAllMessages();
				this._showMessageManager.close();
			}
		},

		/**
		 * Set all the unread messages to read before closing the popover
		 */
		beforePopoverClose: function () {
			if (this._showMessageManager.getModel("message")) {
				//Filter the odata first where the technical field is true
				var oFilteredList = this._showMessageManager.getModel("message").oData.filter(function (element) {
					return element.technical === true;
				});
				//update all the filtered list technical value to false
				oFilteredList.forEach(function (element) {
					element.technical = false;
				});
			}
		}
	});
});