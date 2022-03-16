sap.ui.require([
	"sap/ui/test/Opa5",
	"com/evorait/evosuite/evoorderrelate/test/integration/arrangements/Startup",
	"com/evorait/evosuite/evoorderrelate/test/integration/pages/App"
], function (Opa5, Startup) {
	"use strict";
	Opa5.extendConfig({
		autoWait: true,
		viewNamespace: "com.evorait.evosuite.evoorderrelate.view.",
		viewName: "App",
		arrangements: new Startup()
	});
});