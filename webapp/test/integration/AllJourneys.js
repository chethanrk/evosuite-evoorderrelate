sap.ui.require([
	"sap/ui/test/Opa5",
	"com/evorait/evosuite/evomanagedepend/test/integration/arrangements/Startup",
	"com/evorait/evosuite/evomanagedepend/test/integration/pages/App"
], function (Opa5, Startup) {
	"use strict";
	Opa5.extendConfig({
		autoWait: true,
		viewNamespace: "com.evorait.evosuite.evomanagedepend.view.",
		viewName: "App",
		arrangements: new Startup()
	});
});