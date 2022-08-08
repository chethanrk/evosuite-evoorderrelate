sap.ui.define([], function () {
	"use strict";

	var constants = {
		APPLICATION: {
			EVOPLAN: "EVOPLAN",
			EVOORDER: "EVOORDER",
			EVONOTIFY: "EVONOTIFY",
			EVOEQUIP: "EVOEQUIP"
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
		}
	};

	return constants;

});