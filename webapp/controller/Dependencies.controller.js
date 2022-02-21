sap.ui.define([
	"com/evorait/evosuite/evomanagedepend/controller/TemplateRenderController"
], function (TemplateRenderController) {
	"use strict";

	return TemplateRenderController.extend("com.evorait.evosuite.evomanagedepend.controller.Dependencies", {

		oViewModel: null,
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.evorait.evosuite.evomanagedepend.view.Dependencies
		 */
		onInit: function () {
			this.oViewModel = this.getModel("viewModel");
			this._getLineItems();

			var oRouter = this.getRouter();

			if (!this.oViewModel.getProperty("/bDependencyPageRouteMatchAttached")) {
				oRouter.attachRouteMatched(function (oEvent) {
					this.oViewModel.setProperty("/bDependencyPageRouteMatchAttached", true);

					var sRouteName = oEvent.getParameter("name"),
						sViewName = null;

					this.getOwnerComponent().oTemplatePropsProm.then(function () {
						//route for page gantt view
						if (sRouteName === "ManageDependencies") {
							sViewName = "com.evorait.evosuite.evomanagedepend.view.templates.GanttTable#Table";
							this._onRouteMatched(oEvent, sViewName, "WOHeaderSet");
						}
					}.bind(this));
				}.bind(this));
			}
		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.evorait.evosuite.evomanagedepend.view.Dependencies
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.evorait.evosuite.evomanagedepend.view.Dependencies
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.evorait.evosuite.evomanagedepend.view.Dependencies
		 */
		//	onExit: function() {
		//
		//	}

		/* =========================================================== */
		/* internal methods                                              */
		/* =========================================================== */

		/**
		 * new order create
		 * @param oEvent
		 * @private
		 */
		_onRouteMatched: function (oEvent, sViewName, sEntitySet, mParams) {
			this.oViewModel.setProperty("/busy", true);
			this.getModel().metadataLoaded().then(function () {
				var sPath = this.getEntityPath(sEntitySet, mParams);
				// this.getView().unbindElement();
				// this.getView().bindElement(sPath);
				//get template and create views
				this.insertTemplateFragment(sPath, sViewName, "DependencyPageWrapper", this._afterBindSuccess.bind(this));
			}.bind(this));
		},

		_afterBindSuccess: function () {
			this.oViewModel.setProperty("/busy", false);
		},

		/**
		 * get line item from the entityset 
		 */
		_getLineItems: function () {
			this.getOwnerComponent().oTemplatePropsProm.then(function () {
				var oTempModel = this.getModel("templateProperties"),
					mTabs = oTempModel.getProperty("/GanttConfigs");
				var oModel = this.getModel();

				//collect all tab IDs
				oModel.getMetaModel().loaded().then(function () {
					var sEntitySet = mTabs.entitySet,
						oMetaModel = oModel.getMetaModel(),
						oEntitySet = oMetaModel.getODataEntitySet(sEntitySet),
						oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType),
						aLineItems = oEntityType["com.sap.vocabularies.UI.v1.LineItem"];

					if (aLineItems) {
						oTempModel.setProperty("/GanttConfigs" + "/lineItems", aLineItems);
					}

				}.bind(this));
			}.bind(this));
		}

	});

});