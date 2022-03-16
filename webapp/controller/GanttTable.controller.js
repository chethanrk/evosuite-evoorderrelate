sap.ui.define([
	"com/evorait/evosuite/evomanagedepend/controller/BaseController",
	"sap/gantt/misc/Format",
	"sap/ui/core/Fragment",
	"sap/ui/core/mvc/OverrideExecution",
	"sap/base/util/deepClone",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"com/evorait/evosuite/evomanagedepend/model/formatter"
], function (BaseController, Format, Fragment, OverrideExecution, deepClone, Filter, FilterOperator, formatter) {
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
		},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.evorait.evosuite.evomanagedepend.view.OrderTable
		 */
		//onAfterRendering: function () {
		//
		//		},

		/**
		 * Change network selection which fetch selected netwotk detail to gantt
		 */
		onChangeNetwork: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem"),
				sKey = oSelectedItem.getKey();

			if (this.oViewModel.getProperty("/pendingChanges")) {
				var sTitle = "Confirm",
					sMsg = this.getResourceBundle().getText("msg.leaveWithoutSave");

				var successFn = function () {
					this._getGanttdata(sKey);
				};
				this.showConfirmDialog(sTitle, sMsg, successFn.bind(this));
			} else {
				this._getGanttdata(sKey);
			}

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
			if (!this._selectedRowIndex || this._selectedRowIndex === 0) {
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
			if (!this._selectedRowIndex || this._selectedRowIndex === 0) {
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
			if (!this._selectedRowIndex || this._selectedRowIndex === 0) {
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
			if (!this._selectedRowIndex || this._selectedRowIndex === 0) {
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

			if (oEvent.getParameter("dropPosition") === "Before" && iDropPath > iDragPath) {
				iDropPath--;
			} else if (oEvent.getParameter("dropPosition") === "After" && iDropPath < iDragPath) {
				iDropPath++;
			}

			if (iDropPath === iDragPath) {
				oEvent.preventDefault();
				return;
			}

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
				this.oViewModel.setProperty("/pendingChanges", false);
			};
			this.showConfirmDialog(sTitle, sMsg, successFn.bind(this));
		},

		/**
		 * Handle data recived for the network selection
		 */
		networkDataReceived: function (oData) {
			if (oData.getSource().getPath() !== "/NetworkSet") {
				return;
			}
			var oNetworkSelect = this.getView().byId("idNetworksDropdown"),
				oFirstItem = oNetworkSelect.getFirstItem(),
				sKey = oFirstItem.getKey();

			this._getGanttdata(sKey);
		},

		/**
		 * Handle `press` event on 'Create Network' button
		 * Open Dialog for a new Network creation
		 * @param {sap.ui.base.Event} oEvent - The `press` event
		 */
		onPressCreateNewNetwork: function (oEvent) {
			var oView = this.getView();
			this.getOwnerComponent().NewNetworkDialog.open(oView);
		},

		/**
		 * get gantt table data
		 * @private
		 * @param sNetworkId
		 */
		_getGanttdata: function (sNetworkId) {
			var oTempModel = this.getModel("templateProperties"),
				mTabs = oTempModel.getProperty("/GanttConfigs"),
				sEntitySet = mTabs.entitySet;

			var aFilters = [];
			aFilters.push(new Filter("NETWORK_ID", FilterOperator.EQ, sNetworkId));

			var oFilter = new Filter({
				filters: aFilters,
				and: true
			});

			this.getOwnerComponent().readData("/" + sEntitySet, [oFilter], {}).then(function (oResult) {
				this.oBackupData = deepClone(oResult);
				this.getModel("ganttModel").setData(oResult);
				if (oResult.results) {
					this.getModel("viewModel").setProperty("/GanttRowCount", oResult.results.length);
					this.oViewModel.setProperty("/pendingChanges", false);
					this._selectedRowIndex = null;
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
					oData = oModel.getProperty("/results"),
					DraggedData = oData.splice(iDraggedPath, 1);

				if (iDroppedPath) {
					oData.splice(iDroppedPath, 0, DraggedData[0]);
				}
				this._updateSortSequence(oData);
				this.oViewModel.setProperty("/GanttRowCount", oData.length);
				this.oViewModel.setProperty("/pendingChanges", true);
				oModel.refresh();
			};
			this.showConfirmDialog(sTitle, sMsg, successFn.bind(this));
		},

		/**
		 * update sort id after each sort/delete functionality
		 * @param [oData] gantt table data
		 * Formatter used to format the sortid as 3 digit
		 */
		_updateSortSequence: function (oData) {
			for (var i = 1; i < oData.length; i++) {
				var sSortId = formatter.formatOperationNumber((i + 1).toString(), 3);
				oData[i].SORTID = sSortId;
			}
		}
	});
});