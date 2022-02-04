/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"com/evorait/evosuite/evomanagedepend/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});