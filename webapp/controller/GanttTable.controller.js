sap.ui.define([
	"com/evorait/evosuite/evomanagedepend/controller/BaseController",
	"sap/gantt/misc/Format",
	"sap/ui/core/mvc/OverrideExecution"
], function (BaseController, Format, OverrideExecution) {
	"use strict";

	return BaseController.extend("com.evorait.evosuite.evomanagedepend.controller.GanttTable", {

		metadata: {
			// extension can declare the public methods
			// in general methods that start with "_" are private
			methods: {
				fnTimeConverter: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.Instead
				},

				onGanttRowSelectionChange: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.After
				},

				onPressDeleteDependency: {
					public: true,
					final: true
				},

				onPresTop: {
					public: true,
					final: true
				},

				onPresUp: {
					public: true,
					final: true
				},

				onPresDown: {
					public: true,
					final: true
				},

				onPresBottom: {
					public: true,
					final: true
				},

				onGanttTableDragStart: {
					public: true,
					final: true
				},

				onDropGanttTable: {
					public: true,
					final: true
				},

				onDragEnter: {
					public: true,
					final: true
				}
			}
		},

		_oGanttTableContext: null,

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.evorait.evosuite.evomanagedepend.view.GanttTable
		 */
		onInit: function () {

		},

		fnTimeConverter: function (sTimestamp) {
			return Format.abapTimestampToDate(sTimestamp);
		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.evorait.evosuite.evomanagedepend.view.GanttTable
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.evorait.evosuite.evomanagedepend.view.GanttTable
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.evorait.evosuite.evomanagedepend.view.GanttTable
		 */
		//	onExit: function() {
		//
		//	}

		/**
		 * When row selection has changed in gantt table
		 */
		onGanttRowSelectionChange: function (oEvent) {
			var iRowIndex = oEvent.getParameter("rowIndex"),
				oRowContext = oEvent.getParameter("rowContext");

			if (iRowIndex !== 0) {
				this._oGanttTableContext = oRowContext;
			} else {
				this._oGanttTableContext = null;
				oEvent.getSource().clearSelection();
			}
		},

		/**
		 * Delete dependency operation in the gantttable
		 */
		onPressDeleteDependency: function (oEvent) {
			var sTitle = this.getResourceBundle().getText("tit.confirmDeleteSelected"),
				sMsg = this.getResourceBundle().getText("msg.confirmOperationDelete");

			var successFn = function () {
				sap.m.MessageToast.show("Delete Operation");
			};
			this.showConfirmDialog(sTitle, sMsg, successFn.bind(this));

		},

		/**
		 * Manual sort event to move selected row to top
		 */
		onPresTop: function (oEvent) {
			if (!this._oGanttTableContext) {
				this.showMessageToast("Select atleast one line item");
				return;
			}
			this.showMessageToast("Validation from backend");
		},
		/**
		 * Manual sort event to move selected row to one step up
		 */
		onPresUp: function (oEvent) {
			if (!this._oGanttTableContext) {
				this.showMessageToast("Select atleast one line item");
				return;
			}
			this.showMessageToast("Validation from backend");
		},

		/**
		 * Manual sort event to move selected row to one step down
		 */
		onPresDown: function (oEvent) {
			if (!this._oGanttTableContext) {
				this.showMessageToast("Select atleast one line item");
				return;
			}
			this.showMessageToast("Validation from backend");
		},

		/**
		 * Manual sort event to move selected row to bottom
		 */
		onPresBottom: function (oEvent) {
			if (!this._oGanttTableContext) {
				this.showMessageToast("Select atleast one line item");
				return;
			}
			this.showMessageToast("Validation from backend");
		},

		/**
		 * Event to handle drag from the gantt table
		 */
		onGanttTableDragStart: function (oEvent) {
			var oDraggedRow = oEvent.getParameter("target"),
				oDragSession = oEvent.getParameter("dragSession"),
				oDragBindingContext = oDraggedRow.getBindingContext("ganttModel");

			if (oDragBindingContext.getProperty("TYPE") === 'Start') {
				oEvent.preventDefault();
				return;
			}

			// keep the dragged row context for the drop action
			oDragSession.setComplexData("draggedRowContext", oDragBindingContext);
		},

		/**
		 * Event to handle drop on the gantt table
		 */
		onDropGanttTable: function (oEvent) {
			var oDroppedControl = oEvent.getParameter("droppedControl"),
				oDroppedBindingContext = oDroppedControl.getBindingContext("ganttModel");

			this.showMessageToast("Validation from backend");
		},

		/**
		 * Validate the drop items 
		 */
		onDragEnter: function (oEvent) {
			var oDraggedControl = oEvent.getParameter("target"),
				oDroppedBindingContext = oDraggedControl.getBindingContext("ganttModel");

			if (oDroppedBindingContext.getProperty("TYPE") === 'Start') {
				oEvent.preventDefault();
				return;
			}
		}

	});

});