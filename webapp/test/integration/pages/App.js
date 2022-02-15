sap.ui.define([
	"sap/ui/test/Opa5",
	"com/evorait/evosuite/evomanagedepend/test/integration/pages/Common"
], function (Opa5, Common) {
	"use strict";

	var sViewName = "App",
		sAppControl = "app";

	Opa5.createPageObjects({
		onTheAppPage: {
			baseClass: Common,
			actions: {
				iWaitUntilTheBusyIndicatorIsGone: function () {
					return this.waitFor({
						id: sAppControl,
						viewName: sViewName,
						matchers: function (oRootView) {
							// we set the view busy, so we need to query the parent of the app
							return oRootView.getBusy() === false;
						},
						errorMessage: "The app is still busy."
					});
				}
			},

			assertions: {
				iShouldSeeTheBusyIndicator: function () {
					return this.waitFor({
						id: sAppControl,
						viewName: sViewName,
						success: function (oView) {
							// we set the view busy, so we need to query the parent of the app
							strictEqual(oView.getBusy(), true, "The app is busy");
						},
						errorMessage: "The app is not busy."
					});
				}
			}
		}
	});
});