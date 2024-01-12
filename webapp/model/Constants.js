sap.ui.define([], function () {
	"use strict";

	var constants = {
		APPLICATION: {
			EVOPLAN: "EVOPLAN",
			EVOORDER: "EVOORDER",
			EVONOTIFY: "EVONOTIFY",
			EVOEQUIP: "EVOEQUIP",
			EVOORDREL: "EVOORDREL"
		},
		PROPERTY: {
			EVOORDER: "ORDER_NUMBER",
			EVONOTIFY: "NOTIFICATION_NO",
			EVOEQUIP: "EQUIPMENT_NUMBER",
			EVOORDREL: "NETWORK_KEY"
		},
		LAUNCH_MODE: {
			FIORI: "LAUNCHPAD",
			BSP: "BSP"
		},
		DATEFORMATS: {
			1: "dd.MM.YYYY",
			2: "MM/dd/YYYY",
			3: "MM-dd-YYYY",
			4: "YYYY.MM.dd",
			5: "YYYY/MM/dd",
			6: "YYYY-MM-dd",
			7: "GYY.MM.dd",
			8: "GYY/MM/dd",
			9: "GYY-MM-dd",
			A: "YYYY/MM/dd",
			B: "YYYY/MM/dd",
			C: "YYYY/MM/dd"
		},
		TIMEFORMATS: {
			0:	"HH:mm:ss",
			1:	"KK:mm:ss a",
			2:	"KK:mm:ss a",
			3:	"KK:mm:ss a",
			4:	"KK:mm:ss a"
		}
	};

	return constants;

});