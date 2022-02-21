sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/evorait/evosuite/evomanagedepend/model/models",
	"com/evorait/evosuite/evomanagedepend/controller/ErrorHandler",
	"com/evorait/evosuite/evomanagedepend/controller/MessageManager",
	"sap/ui/model/json/JSONModel"
], function (UIComponent, Device, models, ErrorHandler, MessageManager, JSONModel) {
	"use strict";

	var oMessageManager = sap.ui.getCore().getMessageManager();

	return UIComponent.extend("com.evorait.evosuite.evomanagedepend.Component", {

		metadata: {
			manifest: "json"
		},
		
		oTemplatePropsProm: null,

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// initialize the error handler with the component
			this._oErrorHandler = new ErrorHandler(this);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			this.setModel(models.createMessageManagerModel(), "messageManager");

			this.MessageManager = new MessageManager();

			var viewModelObj = {
				busy: false,
				delay: 100,
				densityClass: this.getContentDensityClass(),
			};
			this.setModel(models.createHelperModel(viewModelObj), "viewModel");
			
			this._getTemplateProps();

			this.setModel(oMessageManager.getMessageModel(), "message");

			// enable routing
			this.getRouter().initialize();
		},

		/**
		 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
		 * design mode class should be set, which influences the size appearance of some controls.
		 * @public
		 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
		 */
		getContentDensityClass: function () {
			if (this._sContentDensityClass === undefined) {
				// check whether FLP has already set the content density class; do nothing in this case
				var element = document.getElementsByTagName("body")[0];
				if (element.classList.contains("sapUiSizeCozy") || element.classList.contains("sapUiSizeCompact")) {
					this._sContentDensityClass = "";
				} else if (!this._isMobile()) { // apply "compact" mode if touch is not supported
					//sapUiSizeCompact
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		},

		/**
		 * check if mobile device
		 * @returns {boolean}
		 * @private
		 */
		_isMobile: function () {
			return sap.ui.Device.system.tablet || sap.ui.Device.system.phone;
		},

		/**
		 * This method registers the view to the message manager
		 * @param oView
		 */
		registerViewToMessageManager: function (oView) {
			oMessageManager.registerObject(oView, true);
		},
		
		/**
		 * get Template properties as model inside a global Promise
		 */
		_getTemplateProps: function () {
			this.oTemplatePropsProm = new Promise(function (resolve) {
				var realPath = sap.ui.require.toUrl("com/evorait/evosuite/evomanagedepend/model/TemplateProperties.json");
				var oTempJsonModel = new JSONModel();
				oTempJsonModel.loadData(realPath);
				oTempJsonModel.attachRequestCompleted(function () {
					this.setModel(oTempJsonModel, "templateProperties");
					resolve(oTempJsonModel.getData());
				}.bind(this));
			}.bind(this));
		},
	});
});