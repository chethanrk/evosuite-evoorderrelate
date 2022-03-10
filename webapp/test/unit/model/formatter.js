sap.ui.define([
	"sap/m/Text",
	"com/evorait/evosuite/evoorderrelate/model/formatter"
], function (Text, formatter) {
	"use strict";

	//*****************************************************************************
	//  EDIT BUTTON
	//****************************************************************************/
	QUnit.module("formatter - editable");

	QUnit.test("should return the icon string 'bell' for the INIT status.", function (assert) {
		assert.strictEqual(formatter.editable(false, false, false), true);
	});

	//*****************************************************************************
	//  STATUS CHANGE BUTTON
	//****************************************************************************/
	QUnit.module("formatter - showStatusButton");

	QUnit.test("should return the icon string 'bell' for the INIT status.", function (assert) {
		assert.strictEqual(formatter.showStatusButton(false, false, false), true);
	});

});