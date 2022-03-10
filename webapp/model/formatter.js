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
		 * gives back a formatted date and time
		 * @param sTimestamp
		 * @returns {datetime}
		 */
		fnTimeConverter: function (sTimestamp) {
			return Format.abapTimestampToDate(sTimestamp);
		}
	};

});