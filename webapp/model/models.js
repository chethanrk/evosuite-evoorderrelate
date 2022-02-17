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

		createMessageManagerModel: function () {
			var oModel = new JSONModel({
				MandatoryInputValue: "",
				DateValue: null,
				IntegerValue: undefined,
				Dummy: ""
			});
			oModel.setDefaultBindingMode("TwoWay");
			return oModel;
		}

	};
});