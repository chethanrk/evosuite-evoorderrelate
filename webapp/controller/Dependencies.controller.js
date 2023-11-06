sap.ui.define([
	"com/evorait/evosuite/evoorderrelate/controller/TemplateRenderController",
	"sap/ui/core/mvc/OverrideExecution"
], function (TemplateRenderController, OverrideExecution) {
	"use strict";

	return TemplateRenderController.extend("com.evorait.evosuite.evoorderrelate.controller.Dependencies", {

		metadata: {
			// extension can declare the public methods
			// in general methods that start with "_" are private
			methods: {}
		},

		oViewModel: null,
		sNetworkId: null,

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.evorait.evosuite.evoorderrelate.view.Dependencies
		 */
		onInit: function () {
			this.oViewModel = this.getModel("viewModel");
			this.eventBus = sap.ui.getCore().getEventBus();

			var oRouter = this.getRouter();

			if (!this.oViewModel.getProperty("/bDependencyPageRouteMatchAttached")) {
				oRouter.attachRouteMatched(function (oEvent) {
					this.oViewModel.setProperty("/bDependencyPageRouteMatchAttached", true);

					var sRouteName = oEvent.getParameter("name"),
						sViewName = null;
					this.sNetworkId = oEvent.getParameter("arguments").networkid;
					this.getOwnerComponent().oTemplatePropsProm.then(function () {
						//route for page gantt view
						if (sRouteName === "ManageDependencies") {
							sViewName = "com.evorait.evosuite.evoorderrelate.view.templates.GanttTable#Table";

							//get annotation line items
							this._getLineItems();
							
							this._onRouteMatched(oEvent, sViewName, "WONetworkHeaderSet");
						}
					}.bind(this));
				}.bind(this));
			}
		},

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

				//get template and create views
				this.insertTemplateFragment(sPath, sViewName, "DependencyPageWrapper", this._afterBindSuccess.bind(this));
			}.bind(this));
		},

		/**
		 * Handle ater bind success
		 * @private
		 */
		_afterBindSuccess: function () {
			this.oViewModel.setProperty("/busy", false);
			if (this.sNetworkId){
				this.eventBus.publish("GanttTable", "refreshGantt", {
					networkid:this.sNetworkId
				});
			}
		},

		/**
		 * get line item from the entityset 
		 * @private
		 */
		_getLineItems: function () {
			this.getOwnerComponent().oTemplatePropsProm.then(function () {
				var oTempModel = this.getModel("templateProperties"),
					mTabs = oTempModel.getProperty("/GanttConfigs"),
					oModel = this.getModel();

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