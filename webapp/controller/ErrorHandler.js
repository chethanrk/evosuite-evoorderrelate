sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageBox",
	"sap/ui/core/mvc/OverrideExecution"
], function (UI5Object, MessageBox, OverrideExecution) {
	"use strict";

	return UI5Object.extend("com.evorait.evosuite.evoorderrelate.controller.ErrorHandler", {

		metadata: {
			// extension can declare the public methods
			// in general methods that start with "_" are private
			methods: {
				constructor: {
					public: true,
					final: true
				}
			}
		},

		/**
		 * Handles application errors by automatically attaching to the model events and displaying errors when needed.
		 * @class
		 * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
		 * @public
		 * @alias com.evorait.evosuite.evoorderrelate.controller.ErrorHandler
		 */
		constructor: function (oComponent) {
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oComponent = oComponent;
			this._oModel = oComponent.getModel();
			this._bMessageOpen = false;
			this._sErrorText = this._oResourceBundle.getText("errorText");

			this._oModel.attachMetadataFailed(function (oEvent) {
				var oParams = oEvent.getParameters();
				this._showServiceError(oParams.response);
			}, this);

			this._oModel.attachRequestFailed(function (oEvent) {
				var oParams = oEvent.getParameters();
				// An entity that was not found in the service is also throwing a 404 error in oData.
				// We already cover this case with a notFound target so we skip it here.
				// A request that cannot be sent to the server is a technical error that we have to handle though
				if (oParams.response.statusCode !== 404) {
					this._showServiceError(oParams.response);
				}
			}, this);
		},

		/**
		 * Shows a {@link sap.m.MessageBox} when a service call has failed.
		 * Only the first error message will be display.
		 * @private
		 * @param sMessage
		 */
		_showServiceError: function (sMessage) {
			if (this._bMessageOpen) {
				return;
			}
			this._bMessageOpen = true;
			if (typeof sMessage === "object") {
				sMessage = this._extractError(sMessage);
			}

			MessageBox.error(
				this._sErrorText, {
					details: sMessage.replace(/\n/g, "<br/>"),
					styleClass: this._oComponent.getContentDensityClass(),
					actions: [MessageBox.Action.CLOSE],
					onClose: function () {
						this._bMessageOpen = false;
					}.bind(this)
				}
			);
		},

		/**
		 * Extract errors from a backend message class
		 * either messages from the backend message class or return the initial error object
		 * @param oResponse
		 * @returns {{responseText}|*|string|string|{responseText}|*}
		 * @private
		 */
		_extractError: function (oResponse) {
			if (!oResponse) {
				return this._oResourceBundle.getText("errorText");
			}
			if (oResponse.responseText) {
				var parsedJSError = null;
				try {
					parsedJSError = jQuery.sap.parseJS(oResponse.responseText);
				} catch (err) {
					return oResponse;
				}
				if (parsedJSError && parsedJSError.error && parsedJSError.error.code) {
					var strError = "";
					//check if the error is from our backend error class
					if (parsedJSError.error.innererror && parsedJSError.error.innererror.errordetails) {
						var aInnerDetails = parsedJSError.error.innererror.errordetails;
						if (aInnerDetails.length > 0) {
							for (var i = 0; i < aInnerDetails.length; i++) {
								strError += String.fromCharCode("8226") + " " + aInnerDetails[i].message + "\n\n";
							}
						} else {
							strError = parsedJSError.error.code + ": " + parsedJSError.error.message.value;
						}
					} else {
						//if there is no message class found
						return oResponse;
					}
					return strError;
				}
			} else if (oResponse.body) {
				return oResponse.body;
			}
			return oResponse;
		}
	});
});