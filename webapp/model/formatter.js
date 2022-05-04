sap.ui.define([
	"sap/ui/core/format/DateFormat",
	"sap/gantt/misc/Format"
], function (DateFormat, Format) {
	"use strict";

	return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */
		numberUnit: function (sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
		},
		/**
		 * gives back a formatted date
		 * @param sValue
		 * @returns {string}
		 */
		date: function (sValue) {
			if (!sValue) {
				return "";
			}
			var TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
			var oDateFormat = DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd"
			});
			return oDateFormat.format(new Date(sValue.getTime() + TZOffsetMs));
		},
		/**
		 * gives back a formatted time
		 * @param sValue
		 * @returns {string}
		 */
		time: function (sValue) {
			if (!sValue) {
				return "";
			}
			var TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
			var oDateFormat = DateFormat.getDateTimeInstance({
				pattern: "kk:mm"
			});
			return oDateFormat.format(new Date(sValue.ms + TZOffsetMs));
		},

		/**
		 * @param sortNo
		 * @param max
		 * @returns {*}
		 */
		formatOperationNumber: function (sortNo, max) {
			return sortNo.length < max ? this.formatOperationNumber("0" + sortNo, max) : sortNo;
		},

		/**
		 * Delete button visibility based on network operation property
		 * also validate to disable delte button for the first network operation
		 * @param sSortId - SortId of first network operation
		 * @param bAllowDelete - ALLOW_DELETE of selected newtwork operation
		 */
		deleteNetworkOperation: function (sSortId, bAllowDelete) {
			if (sSortId !== '001' || bAllowDelete) {
				return true;
			}
			return false;
		},

		/**
		 * merge given date and time to datetime and format
		 * @param date
		 * @param time
		 */
		mergeDateTime: function (date, time) {
			var oDatebject = null,
				offsetMs = new Date(0).getTimezoneOffset() * 60 * 1000,
				dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "yyyy-MM-dd"
				}),
				timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
					pattern: "HH:mm:ss"
				});

			if (date && time) {
				var dateStr = dateFormat.format(new Date(date.getTime() + offsetMs));
				var timeStr = timeFormat.format(new Date(time.ms + offsetMs));
				oDatebject = new Date(dateStr + "T" + timeStr);
			}

			return oDatebject;
		},

		/**
		 * return relationship type based on relationship key
		 */
		getRelationType: function (sRelationShipId) {
			if (sRelationShipId) {
				if (sRelationShipId === "1") {
					return "FinishToStart";
				} else if (sRelationShipId === "2") {
					return "StartToStart";
				} else if (sRelationShipId === "3") {
					return "FinishToFinish";
				} else if (sRelationShipId === "4") {
					return "StartToFinish";
				}
			}
			return "StartToFinish";
		},

		/**
		 * Handle relationship dropdown control visibility
		 * 
		 */
		handleRelationshipDropDownVisibility: function (sSortId, iGanttCount) {
			if (sSortId && iGanttCount) {
				if (parseInt(sSortId, 10) === iGanttCount) {
					return false;
				}
				return true;
			}
			return false;
		},

		/**
		 * Convert string number to integer
		 */
		getIntMaxLength: function (sMaxLength) {
			if (!sMaxLength) {
				return 0;
			}
			return parseInt(sMaxLength, 10);
		}

	};

});