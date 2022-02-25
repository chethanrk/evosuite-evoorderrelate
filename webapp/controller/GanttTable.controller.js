sap.ui.define([
	"com/evorait/evosuite/evomanagedepend/controller/BaseController",
	"sap/gantt/misc/Format",
	"sap/ui/core/mvc/OverrideExecution",
	"sap/base/util/deepClone"
], function (BaseController, Format, OverrideExecution, deepClone) {
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
				},

				onPressNetworkDelete: {
					public: true,
					final: true
				},

				onPressNetwokCancel: {
					public: true,
					final: true
				}
			}
		},

		_selectedRowIndex: null,
		oViewModel: null,
		oBackupData: {},

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.evorait.evosuite.evomanagedepend.view.GanttTable
		 */
		onInit: function () {
			this.oViewModel = this.getModel("viewModel");
			//get gantt data
			this._getGanttdata();
		},

		fnTimeConverter: function (sTimestamp) {
			return Format.abapTimestampToDate(sTimestamp);
		},

		/**
		 * When row selection has changed in gantt table
		 */
		onGanttRowSelectionChange: function (oEvent) {
			this._selectedRowIndex = oEvent.getParameter("rowIndex");

			if (this._selectedRowIndex === 0) {
				oEvent.getSource().clearSelection();
			}
		},

		/**
		 * Delete dependency operation in the gantttable
		 */
		onPressDeleteDependency: function (oEvent) {
			var oSelectedRow = oEvent.getParameter("row"),
				oContext = oSelectedRow.getBindingContext("ganttModel"),
				iSelectedRow = parseInt(oContext.getPath().slice(-1), 10);

			this._tablSortAndDelete(iSelectedRow);
		},

		/**
		 * Manual sort event to move selected row to top
		 */
		onPressTop: function (oEvent) {
			if (!this._selectedRowIndex && this._selectedRowIndex === 0) {
				this.showMessageToast("Select atleast one line item");
				return;
			}

			if (this._selectedRowIndex < 2) {
				return;
			}

			this._tablSortAndDelete(this._selectedRowIndex, 1);
		},
		/**
		 * Manual sort event to move selected row to one step up
		 */
		onPressUp: function (oEvent) {
			if (!this._selectedRowIndex && this._selectedRowIndex === 0) {
				this.showMessageToast("Select atleast one line item");
				return;
			}

			if (this._selectedRowIndex < 2) {
				return;
			}
			this._tablSortAndDelete(this._selectedRowIndex, (this._selectedRowIndex - 1));
		},

		/**
		 * Manual sort event to move selected row to one step down
		 */
		onPressDown: function (oEvent) {
			if (!this._selectedRowIndex && this._selectedRowIndex === 0) {
				this.showMessageToast("Select atleast one line item");
				return;
			}

			var iGanttRowCount = parseInt(this.oViewModel.getProperty("/GanttRowCount"), 10);

			if (this._selectedRowIndex > (iGanttRowCount - 2)) {
				return;
			}

			this._tablSortAndDelete(this._selectedRowIndex, (this._selectedRowIndex + 1));
		},

		/**
		 * Manual sort event to move selected row to bottom
		 */
		onPressBottom: function (oEvent) {
			if (!this._selectedRowIndex && this._selectedRowIndex === 0) {
				this.showMessageToast("Select atleast one line item");
				return;
			}

			var iGanttRowCount = parseInt(this.oViewModel.getProperty("/GanttRowCount"), 10);

			if (this._selectedRowIndex > (iGanttRowCount - 2)) {
				return;
			}

			if (iGanttRowCount) {
				var iDropPath = iGanttRowCount - 1;
				this._tablSortAndDelete(this._selectedRowIndex, iDropPath);
			}
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
				oDroppedBindingContext = oDroppedControl.getBindingContext("ganttModel"),
				iDropPath = parseInt(oDroppedBindingContext.getPath().slice(-1), 10);

			var oDraggedControl = oEvent.getParameter("draggedControl"),
				oDraggedBindingContext = oDraggedControl.getBindingContext("ganttModel"),
				iDragPath = parseInt(oDraggedBindingContext.getPath().slice(-1), 10);

			this._tablSortAndDelete(iDragPath, iDropPath);

		},

		/**
		 * Validate the drop items 
		 */
		onDragEnter: function (oEvent) {
			var oDroppedControl = oEvent.getParameter("target"),
				oDroppedBindingContext = oDroppedControl.getBindingContext("ganttModel");

			if (oDroppedBindingContext.getProperty("TYPE") === 'Start') {
				oEvent.preventDefault();
				return;
			}
		},

		/**
		 * Delete selected network
		 */
		onPressNetworkDelete: function (oEvent) {
			var sTitle = this.getResourceBundle().getText("tit.confirmDeleteSelected"),
				sMsg = this.getResourceBundle().getText("msg.confirmNetworkDelete");

			var successFn = function () {
				sap.m.MessageToast.show("Delete Network");
			};
			this.showConfirmDialog(sTitle, sMsg, successFn.bind(this));
		},

		/**
		 * Cancel operation changes for the selected network
		 */
		onPressNetwokCancel: function (oEvent) {
			var sTitle = this.getResourceBundle().getText("tit.confirmCancelSelected"),
				sMsg = this.getResourceBundle().getText("msg.confirmNetworkCancel");

			var successFn = function () {
				var oResetData = {};
				oResetData = deepClone(this.oBackupData);
				this.getModel("ganttModel").setData(oResetData);
				this.getModel("ganttModel").refresh();
			};
			this.showConfirmDialog(sTitle, sMsg, successFn.bind(this));
		},

		/**
		 * get gantt table data
		 * @private
		 */
		_getGanttdata: function () {
			var oTempModel = this.getModel("templateProperties"),
				mTabs = oTempModel.getProperty("/GanttConfigs"),
				sEntitySet = mTabs.entitySet;

			this.getOwnerComponent().readData("/" + sEntitySet, [], {}).then(function (oResult) {
				this.oBackupData = deepClone(oResult);
				this.getModel("ganttModel").setData(oResult);
				if (oResult.results) {
					this.getModel("viewModel").setProperty("/GanttRowCount", oResult.results.length);
				}
			}.bind(this));
		},

		/**
		 * Handle to sort and delete functionality
		 * @param iDraggedPath index of where it placed before change
		 * @param iDroppedPath index of where to place after change
		 */
		_tablSortAndDelete: function (iDraggedPath, iDroppedPath) {
			var sTitle = "Confirm",
				sMsg = "Do you really want to continue after validation";

			var successFn = function () {
				var oModel = this.getModel("ganttModel"),
					oData = oModel.getData(),
					DraggedData = oData.results.splice(iDraggedPath, 1);

				if (iDroppedPath) {
					oData.results.splice(iDroppedPath, 0, DraggedData[0]);
				}
				this.oViewModel.setProperty("/GanttRowCount", oData.results.length);
				oModel.refresh();
			};
			this.showConfirmDialog(sTitle, sMsg, successFn.bind(this));
		}

	});

});