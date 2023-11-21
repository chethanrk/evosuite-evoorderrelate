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
		TIMEFORMATS: {
			0:	"HH:mm:ss",
			1:	"HH:mm:ss a",
			2:	"HH:mm:ss a",
			3:	"KK:mm:ss a",
			4:	"KK:mm:ss a"
		}
	};

	return constants;

});