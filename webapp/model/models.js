sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {

		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		createHelperModel: function (obj) {
			var oModel = new JSONModel(obj);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		createGanttModel: function () {
			var oModel = new JSONModel();
			oModel.setDefaultBindingMode("TwoWay");
			return oModel;
		},
		createMessageManagerModel: function () {
			var oModel = new JSONModel({
				MandatoryInputValue: "",
				DateValue: null,
				IntegerValue: undefined,
				Dummy: ""
			});
			oModel.setDefaultBindingMode("TwoWay");
			return oModel;
		},
		createInformationModel: function (oComponent) {
			var oMetadata = oComponent.getMetadata();
			var oManifest = oMetadata._oManifest;
			var oModel = new JSONModel();

			var oInformation = {
				appVersion: oManifest._oManifest["sap.app"].applicationVersion.version,
				ui5Version: sap.ui.getVersionInfo().version,
				language: sap.ui.getCore().getConfiguration().getLocale().getSAPLogonLanguage()
			};
			oModel.setData(oInformation);
			return oModel;
		},
		createUserModel: function (User) {
			var oModel = new JSONModel(User);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		createMessageModel: function () {
			var oModel = new JSONModel([]);
			oModel.setDefaultBindingMode("TwoWay");
			return oModel;
		}
	};
});