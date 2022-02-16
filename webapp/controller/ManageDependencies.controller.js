sap.ui.define([
	"com/evorait/evosuite/evomanagedepend/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/gantt/misc/Format",
	"sap/gantt/misc/Utility"
], function (BaseController, JSONModel, Format, Utility) {
	"use strict";

	return BaseController.extend("com.evorait.evosuite.evomanagedepend.controller.ManageDependencies", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.evorait.evosuite.evomanagedepend.view.ManageDependencies
		 */
		onInit: function () {

			var data = {
				"root": {
					"children": [{
						"id": "line1",
						"text": "Level 1",
						"task": [{
							"id": "rectangle1",
							"startTime": "20181101090000",
							"endTime": "20181127090000"
						}],
						"children": [{
							"id": "line2",
							"text": "Level 2",
							"subtask": [{
								"id": "chevron1",
								"startTime": "20181101090000",
								"endTime": "20181113090000"
							}, {
								"id": "chevron2",
								"startTime": "20181115090000",
								"endTime": "20181127090000"
							}]
						}]
					}]
				}
			};
			var oModel = new JSONModel(data);
			//this.getView().byId("idTableDependencies").setModel(oModel);

		},
		fnTimeConverter: function (sTimestamp) {
			return Format.abapTimestampToDate(sTimestamp);
		}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.evorait.evosuite.evomanagedepend.view.ManageDependencies
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.evorait.evosuite.evomanagedepend.view.ManageDependencies
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.evorait.evosuite.evomanagedepend.view.ManageDependencies
		 */
		//	onExit: function() {
		//
		//	}

	});

});