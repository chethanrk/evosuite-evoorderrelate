sap.ui.define([
	"com/evorait/evosuite/evomanagedepend/controller/BaseController",
	"sap/ui/core/Fragment",
	"sap/ui/core/mvc/OverrideExecution",
	"sap/base/util/deepClone",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"com/evorait/evosuite/evomanagedepend/model/formatter"
], function (BaseController, Fragment, OverrideExecution, deepClone, Filter, FilterOperator, formatter) {
	"use strict";

	return BaseController.extend("com.evorait.evosuite.evoorderrelate.controller.GanttTable", {

		metadata: {
			// extension can declare the public methods
			// in general methods that start with "_" are private
			methods: {

				onGanttRowSelectionChange: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.After
				},

				onChangeType: {
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
		oUpdatedBackupData: {},

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.evorait.evosuite.evoorderrelate.view.GanttTable
		 */
		onInit: function () {
			this.oViewModel = this.getModel("viewModel");
			this.oViewModel.setProperty("/gantBusy", true);
		},

		/**
		 * Change network selection which fetch selected netwotk detail to gantt
		 * Confirmation dialog will open if existing entry has some changes 
		 * New data fetch  from backend for the selected network
		 * @param {sap.ui.base.Event} oEvent - the change event
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

		/**
		 * Change type selection which validate with backend
		 * @param {sap.ui.base.Event} oEvent - the change event
		 */
		onChangeType: function (oEvent) {
			var oSource = oEvent.getSource(),
				oSourceModel = oSource.getBindingContext("ganttModel"),
				oSelectedItem = oEvent.getParameter("selectedItem"),
				oSelectedContext = oSelectedItem.getBindingContext(),
				sType = oSelectedContext.getProperty("AOBKY"),
				oRelashinShip = oSourceModel.getProperty("NetworkToGanttRelation");

			var sTitle = "Confirm",
				sMsg = "Do you really want to continue after validation";

			var successFn = function () {
				oRelashinShip.results[0].REL_KEY = sType;
				this.oViewModel.setProperty("/pendingChanges", true);
				this.getModel("ganttModel").refresh();
			};

			if (oRelashinShip && oRelashinShip.results && oRelashinShip.results.length) {
				this.showConfirmDialog(sTitle, sMsg, successFn.bind(this));
			}
		},

		/**
		 * When row selection has changed in gantt table
		 * Which help to hold selected row index in the global varibale _selectedRowIndex
		 * Validate the row selection and clear the selection if selection of first item
		 * @param {sap.ui.base.Event} oEvent - the change event
		 */
		onGanttRowSelectionChange: function (oEvent) {
			this._selectedRowIndex = oEvent.getParameter("rowIndex");

			if (this._selectedRowIndex === 0) {
				oEvent.getSource().clearSelection();
			}
		},

		/**
		 * Delete dependency operation in the gantttable
		 * validated with backend
		 * @param {sap.ui.base.Event} oEvent - the press event
		 */
		onPressDeleteDependency: function (oEvent) {
			var oSelectedRow = oEvent.getParameter("row"),
				oContext = oSelectedRow.getBindingContext("ganttModel"),
				iSelectedRow = parseInt(oContext.getPath().slice(-1), 10);

			this._tablSortAndDelete(iSelectedRow);
		},

		/**
		 * Manual sort event to move selected row to top
		 * validates the row selection
		 * @param {sap.ui.base.Event} oEvent - the press event
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
		 * validates the row selection
		 * @param {sap.ui.base.Event} oEvent - the press event
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
		 * validates the row selection
		 * @param {sap.ui.base.Event} oEvent - the press event
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
		 * validates the row selection
		 * @param {sap.ui.base.Event} oEvent - the press event
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
		 * validates the row selection
		 * @param {sap.ui.base.Event} oEvent - the drag event
		 */
		onGanttTableDragStart: function (oEvent) {
			var oDraggedRow = oEvent.getParameter("target"),
				oDragSession = oEvent.getParameter("dragSession"),
				oDragBindingContext = oDraggedRow.getBindingContext("ganttModel");

			if (oDragBindingContext.getProperty("SORT_ID") === '001') {
				oEvent.preventDefault();
				return;
			}

			// keep the dragged row context for the drop action
			oDragSession.setComplexData("draggedRowContext", oDragBindingContext);
		},

		/**
		 * Event to handle drop on the gantt table
		 * @param {sap.ui.base.Event} oEvent - the grop event
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
		 * validates the row selection
		 * @param {sap.ui.base.Event} oEvent - the dragenter event
		 */
		onDragEnter: function (oEvent) {
			var oDroppedControl = oEvent.getParameter("target"),
				oDroppedBindingContext = oDroppedControl.getBindingContext("ganttModel");

			if (oDroppedBindingContext.getProperty("SORT_ID") === '001') {
				oEvent.preventDefault();
				return;
			}
		},

		/**
		 * Delete selected network
		 * Confirmation dialog will open 
		 * @param {sap.ui.base.Event} oEvent - the press event
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
		 * Confirmation dialog will open
		 * @param {sap.ui.base.Event} oEvent - the press event
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
		 * * @param {sap.ui.base.Event} oEvent - the dataReceived event
		 */
		networkDataReceived: function (oEvent) {
			if (oEvent.getSource().getPath() !== "/SHNetworkSet") {
				return;
			}
			var oNetworkSelect = this.getView().byId("idNetworksDropdown"),
				oFirstItem = oNetworkSelect.getFirstItem(),
				sKey = oFirstItem.getKey();
			//sKey = "000000834050_0050_01";
			oNetworkSelect.setSelectedKey(sKey);
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
				sEntitySet = mTabs.entitySet,
				aFilters = [];

			this.oViewModel.setProperty("/gantBusy", true);

			aFilters.push(new Filter("NETWORK_KEY", FilterOperator.EQ, sNetworkId));

			var oFilter = new Filter({
				filters: aFilters,
				and: true
			});

			this.getOwnerComponent().readData("/" + sEntitySet, [oFilter], {
				$expand: "NetworkToGanttRelation"
			}).then(function (oResult) {
				this.oBackupData = deepClone(oResult);
				this.getModel("ganttModel").setData(oResult);
				this.getModel("viewModel").setProperty("/GanttRowCount", oResult.results.length);
				if (oResult.results && oResult.results.length) {
					this.oViewModel.setProperty("/pendingChanges", false);
					this._selectedRowIndex = null;
				}
				this.oViewModel.setProperty("/gantBusy", false);
			}.bind(this), function (error) {
				this.oBackupData = null;
				this.getModel("ganttModel").setData({
					"results": []
				});
				this.oViewModel.setProperty("/gantBusy", false);
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
				this._updateSortandRelationshipSequence(oData);
				this.oViewModel.setProperty("/GanttRowCount", oData.length);
				this.oViewModel.setProperty("/pendingChanges", true);
				oModel.refresh();
			};
			this.showConfirmDialog(sTitle, sMsg, successFn.bind(this));
		},

		/**
		 * update sort id and relationship after each sort/delete functionality
		 * Formatter used to format the sortid as 3 digit
		 * @param [oData] gantt table data
		 */
		_updateSortandRelationshipSequence: function (oData) {
			for (var i = 1; i < oData.length; i++) {
				var sSortId = formatter.formatOperationNumber((i + 1).toString(), 3);
				oData[i].SORT_ID = sSortId;

				oData[i].NetworkToGanttRelation.results[0] = {};

				oData[i].NetworkToGanttRelation.results[0].ObjectKey = oData[i].ObjectKey;
				oData[i].NetworkToGanttRelation.results[0].HeaderObjectKe = oData[i].ObjectKey;
				oData[i].NetworkToGanttRelation.results[0].PRE_OBJECT_KEY = oData[i].ObjectKey;

				oData[i].NetworkToGanttRelation.results[0].SUC_OBJECT_KEY = oData[i - 1].ObjectKey;
			}
		}
	});
});