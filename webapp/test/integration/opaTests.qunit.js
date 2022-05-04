/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"com/evorait/evosuite/evoorderrelate/localService/mockserver",
		"com/evorait/evosuite/evoorderrelate/test/integration/AllJourneys"
	], function (mockserver) {
		mockserver.init();
		QUnit.start();
	});
});