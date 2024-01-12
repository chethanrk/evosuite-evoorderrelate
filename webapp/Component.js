/* globals moment */
sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/evorait/evosuite/evoorderrelate/model/models",
	"com/evorait/evosuite/evoorderrelate/controller/ErrorHandler",
	"com/evorait/evosuite/evoorderrelate/controller/MessageManager",
	"com/evorait/evosuite/evoorderrelate/controller/NewNetworkDialog",
	"com/evorait/evosuite/evoorderrelate/controller/NetworkSelection",
	"sap/ui/model/json/JSONModel",
	"com/evorait/evosuite/evoorderrelate/model/Constants",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (UIComponent, Device, models, ErrorHandler, MessageManager, NewNetworkDialog, NetworkSelection, JSONModel, Constants, Filter,
	FilterOperator) {
	"use strict";

	var oMessageManager = sap.ui.getCore().getMessageManager();

	return UIComponent.extend("com.evorait.evosuite.evoorderrelate.Component", {

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

			this.setModel(models.createUserModel(this), "user");

			this.setModel(models.createInformationModel(this), "InformationModel");

			this.setModel(models.createMessageManagerModel(), "messageManager");

			//Creating the Global message model for MessageManager
			this.setModel(models.createMessageModel(), "message");

			this.MessageManager = new MessageManager();

			this.NewNetworkDialog = new NewNetworkDialog();
			this.NetworkSelection = new NetworkSelection();

			var viewModelObj = {
				formHandling: {},
				busy: false,
				gantBusy: false,
				delay: 100,
				densityClass: this.getContentDensityClass(),
				pendingChanges: false,
				networkKey: null,
				gantt: {
					defaultStartDate: moment().startOf("month").subtract(2, "months").toDate(),
					defaultEndDate: moment().endOf("month").add(2, "months").toDate()
				},
				visibleHorizon: {
					visibleStartDate: moment().toDate(),
					visibleEndDate: moment().toDate()
				},
				draggedData: null,
				logoUrl: sap.ui.require.toUrl("com/evorait/evosuite/evoorderrelate/assets/img/EvoOrderRelate.png"),
				validateIW32Auth: true,
				sDatePattern: "",
				sDateTimePattern: "",
				sTimePattern: "",
				sTimePatternCode: ""
			};
			this.setModel(models.createHelperModel(viewModelObj), "viewModel");
			this.setModel(models.createGanttModel(), "ganttModel");

			this._getSystemInformation();

			this.oSystemInfoProm.then(this._handleAuthorization.bind(this));

			this._getTemplateProps();

			// enable routing
			//this.getRouter().initialize();
			//get start parameter when app2app navigation is in URL
			//replace hash when startup parameter
			//and init Router after success or fail
			this._initRouter();
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
		 * Check for a Startup parameter and look for Order ID in Backend
		 * When there is a filtered Order replace route hash
		 */
		_initRouter: function () {
			var mParams = this._getStartupParamFilter();
			if (typeof mParams === "object") {
				this.readData("/" + mParams.entitySet, [mParams.filter]).then(function (mResult) {
					if (mResult && mResult.results && mResult.results.length) {
						this.getModel("viewModel").setProperty("/networkKey", mResult.results[0].ObjectKey);
					}
					this.getRouter().initialize();
				}.bind(this));
			} else {
				// create the views based on the url/hash
				this.getRouter().initialize();
			}
		},

		/**
		 * Get url GET parameter by key name
		 * @param {string} sKey - key of the parameter
		 */
		getLinkParameterByName: function (sKey) {
			var oComponentData = this.getComponentData();
			//Fiori Launchpad startup parameters
			if (oComponentData) {
				var oStartupParams = oComponentData.startupParameters;
				if (oStartupParams[sKey] && (oStartupParams[sKey].length > 0)) {
					return oStartupParams[sKey][0];
				} else if (!sKey) {
					return oStartupParams;
				}
			} else {
				var queryString = window.location.search,
					urlParams = new URLSearchParams(queryString);
				if (urlParams.has(sKey)) {
					return urlParams.get(sKey);
				} else if (!sKey) {
					return urlParams;
				}
			}
			return false;
		},

		/**
		 * When in link is startup parameter from FLP or Standalone app
		 * then App2App navigation happened and this app shoul show a detail page
		 */
		_getStartupParamFilter: function () {
			var sKey = this.getLinkParameterByName(Constants.PROPERTY.EVOORDREL);

			if (sKey) {
				return {
					entitySet: "WONetworkHeaderSet",
					filter: new Filter({
						filters: [
							new Filter(Constants.PROPERTY.EVOORDREL, FilterOperator.EQ, sKey)
						],
						and: true
					})
				};
			}

			return false;
		},

		/**
		 * get Template properties as model inside a global Promise
		 */
		_getTemplateProps: function () {
			this.oTemplatePropsProm = new Promise(function (resolve) {
				var realPath = sap.ui.require.toUrl("com/evorait/evosuite/evoorderrelate/model/TemplateProperties.json");
				var oTempJsonModel = new JSONModel();
				oTempJsonModel.loadData(realPath);
				oTempJsonModel.attachRequestCompleted(function () {
					this.setModel(oTempJsonModel, "templateProperties");
					resolve(oTempJsonModel.getData());
				}.bind(this));
			}.bind(this));
		},

		/**
		 * Calls the GetSystemInformation 
		 */
		_getSystemInformation: function () {
			this.oSystemInfoProm = new Promise(function (resolve) {
				this.readData("/SystemInformationSet", []).then(function (oData) {
					this.getModel("user").setData(oData.results[0]);
					resolve(oData.results[0]);
					this.fnSetDefaultDateTimePattern(oData.results[0]);
				}.bind(this));
			}.bind(this));
		},

		/**
		 * Read from oData model service url with filters
		 * returns promise
		 */
		readData: function (sUri, aFilters, mUrlParams) {
			return new Promise(function (resolve, reject) {
				this.getModel().read(sUri, {
					filters: aFilters,
					urlParameters: mUrlParams || {},
					success: function (oData) {
						resolve(oData);
					},
					error: function (oError) {
						//Handle Error
						reject(oError);
					}
				});
			}.bind(this));
		},

		/**
		 * post data
		 * returns promise
		 */
		postData: function (sUri, oEntry) {
			return new Promise(function (resolve, reject) {
				this.getModel().create(sUri, oEntry, {
					refreshAfterChange: false,
					success: function (oData) {
						resolve(oData);
					},
					error: function (oError) {
						//Handle Error
						reject(oError);
					}
				});
			}.bind(this));
		},

		/**
		 * Adds messages from MessageModel to local message model
		 */
		createMessages: function () {
			var aMessages = [];
			var oMessageModel = sap.ui.getCore().getMessageManager().getMessageModel();
			var oData = oMessageModel.getData();

			if (oData.length === 0) {
				return;
			}
			for (var i = 0; i < oData.length; i++) {
				aMessages.push(oData[i]);
			}
			this.getModel("message").setData(aMessages);
		},

		/**
		 * Handle SAP authorization
		 */
		_handleAuthorization: function () {
			var bPMAuth = this.getModel("user").getProperty("/ENABLE_PM_AUTH_CHECK"),
				bIW32Auth = this.getModel("user").getProperty("/ENABLE_IW32_AUTH_CHECK");
			if (bPMAuth) {
				this.getModel("viewModel").setProperty("/validateIW32Auth", Boolean(bIW32Auth));
			}
		},

		/**
		 * Function to set Default date and time pattern in global models and it's properties
		 * @param {object} oDefaultData
		 */
		fnSetDefaultDateTimePattern: function (oDefaultData) {
			var oLocale, oDateFormat, oDateTimeFormat, oTimeFormat;
			
			//Check if app is running on Cloud Launchpad and if backend Fiori format set to true
			if(!oDefaultData.ENABLE_READ_FIORI_FORMAT && sap.ushell?.cloudServices) {
				oLocale = new sap.ui.core.Locale(sap.ui.getCore().getConfiguration().getLanguage()),
				oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({ style: "medium" }, oLocale).oFormatOptions['pattern'],
				oDateTimeFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({ style: "medium" }, oLocale).oFormatOptions['pattern'],
				oTimeFormat = sap.ui.core.format.DateFormat.getTimeInstance({ style: "medium" }, oLocale).oFormatOptions['pattern'];
			} else {				
				oDateFormat = Constants.DATEFORMATS[oDefaultData.DEFAULT_DATE_FORMAT], //Set DateFomat through Constants based on date format code
				oTimeFormat = Constants.TIMEFORMATS[oDefaultData.DEFAULT_TIME_FORMAT], //Set TimeFormat through constants based on time format code
				oDateTimeFormat = oDateFormat + ', ' + oTimeFormat;
			}
			//set default date pattern to viewModel
			this.getModel("viewModel").setProperty("/sDatePattern", oDateFormat);
			this.getModel("viewModel").setProperty("/sTimePattern", oTimeFormat);
			this.getModel("viewModel").setProperty("/sDateTimePattern", oDateTimeFormat);
			this.getModel("viewModel").setProperty("/sTimePatternCode", oDefaultData.DEFAULT_TIME_FORMAT);
		}
	});
});