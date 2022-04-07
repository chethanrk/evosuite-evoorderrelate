sap.ui.define([
	"com/evorait/evosuite/evoorderrelate/controller/BaseController",
	"sap/ui/core/Fragment",
	"sap/ui/core/mvc/OverrideExecution",
	"sap/base/util/deepClone",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"com/evorait/evosuite/evoorderrelate/model/formatter"
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
					final: false,
					overrideExecution: OverrideExecution.Before
				},

				onPresTop: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.After
				},

				onPresUp: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.After
				},

				onPresDown: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.After
				},

				onPresBottom: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.After
				},

				onGanttTableDragStart: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.After
				},

				onDropGanttTable: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.After
				},

				onDragEnter: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.After
				},

				onPressCreateNewNetwork: {
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
				},
				onNetworkValueHelpRequested: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.Instead
				}
			}
		},

		_selectedRowIndex: null,
		oViewModel: null,
		oNetworkSelection: null,

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.evorait.evosuite.evoorderrelate.view.GanttTable
		 */
		onInit: function () {
			this.oViewModel = this.getModel("viewModel");
			this.oNetworkSelection = this.getView().byId("idNetworkKey");

			var eventBus = sap.ui.getCore().getEventBus();
			//Binnding has changed in TemplateRenderController.js
			eventBus.subscribe("TemplateRendererNetworkOperation", "changedBinding", this._changedBinding, this);
		},

		onAfterRendering: function (oEvent) {
			this.oViewModel.setProperty("/gantBusy", false);
			//set special network from app-to-app navigation 
			if (this.oViewModel.getProperty("/networkKey") && this.oNetworkSelection) {
				var sKey = this.oViewModel.getProperty("/networkKey");
				this.oNetworkSelection.fireChange({
					value: sKey
				});
			}
		},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.evorait.evosuite.evoorderrelate.view.GanttTable
		 */
		onExit: function () {
			var eventBus = sap.ui.getCore().getEventBus();
			eventBus.unsubscribe("TemplateRendererNetworkOperation", "changedBinding", this._changedBinding, this);
		},

		/**
		 * Event bus method to add selected order operation to network
		 */
		_changedBinding: function (sChannel, sEvent, oData) {
			if (sChannel === "TemplateRendererNetworkOperation" && sEvent === "changedBinding") {
				var iDropPath = parseInt(this.oViewModel.getProperty("/GanttRowCount"), 10),
					oDroppedBindingContext = this.getView().byId("idTableGanttTable").getContextByIndex(iDropPath - 1);
				if (iDropPath && oDroppedBindingContext) {
					this._getFormatedOrderOperation(iDropPath, oDroppedBindingContext, oData.data).then(function (aOrderOperations) {
						this._tablSortAndDelete(null, iDropPath, aOrderOperations);
					}.bind(this));
				}
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
				oRelashinShip = oSourceModel.getProperty("NetworkOperationsToGantt");

			if (oSourceModel && sType && oRelashinShip && oRelashinShip.results && oRelashinShip.results.length) {
				oRelashinShip.results[0].REL_KEY = sType;
				this.validateNetworkOperations(this.getModel("ganttModel").getData());
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
			if (this.selectionValidation(this._selectedRowIndex, "Up")) {
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
			if (this.selectionValidation(this._selectedRowIndex, "Up")) {
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
			var iGanttRowCount = parseInt(this.oViewModel.getProperty("/GanttRowCount"), 10);
			if (this.selectionValidation(this._selectedRowIndex, "Down", iGanttRowCount)) {
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
			var iGanttRowCount = parseInt(this.oViewModel.getProperty("/GanttRowCount"), 10);
			if (this.selectionValidation(this._selectedRowIndex, "Down", iGanttRowCount)) {
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
		 * Event to handle drop on the gantt table
		 * @param {sap.ui.base.Event} oEvent - the grop event
		 */
		onDropGanttTableFromOperation: function (oEvent) {
			var oDroppedControl = oEvent.getParameter("droppedControl"),
				oDroppedBindingContext = oDroppedControl.getBindingContext("ganttModel"),
				iDropPath = parseInt(oDroppedBindingContext.getPath().slice(-1), 10),
				aDraggedContext = this.getModel("viewModel").getProperty("/dragSession");

			if (oEvent.getParameter("dropPosition") === "After") {
				iDropPath++;
			}

			if (iDropPath === 0) {
				oEvent.preventDefault();
				return;
			}

			this._getFormatedOrderOperation(iDropPath, oDroppedBindingContext, aDraggedContext).then(function (aOrderOperations) {
				this._tablSortAndDelete(null, iDropPath, aOrderOperations);
			}.bind(this));
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
			var sKey = this.oNetworkSelection.getValue();

			if (!this.oNetworkSelection || !sKey) {
				var sMsgv = this.getResourceBundle().getText("msg.noNetworkSelected");
				this.showMessageToast(sMsgv);
				return;
			}

			var sTitle = this.getResourceBundle().getText("tit.confirmDeleteSelected"),
				sMsg = this.getResourceBundle().getText("msg.confirmNetworkDelete");
			if (this.getModel("viewModel").getProperty("/pendingChanges")) {
				sMsg = this.getResourceBundle().getText("msg.leaveWithoutSave") +
					"\n\n" + sMsg;
			}

			var successFn = function () {
				var oResetData = {};
				oResetData = deepClone(this.oBackupData);
				this.oUpdatedBackupData = deepClone(this.oBackupData);
				this.refreshGanttModel(oResetData, true);
				this.oViewModel.setProperty("/pendingChanges", false);
				this.deleteNetwork(oResetData);
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
				this.oUpdatedBackupData = deepClone(this.oBackupData);
				this.refreshGanttModel(oResetData, true);
				this.oViewModel.setProperty("/pendingChanges", false);
			};
			this.showConfirmDialog(sTitle, sMsg, successFn.bind(this));
		},

		/**
		 * Handle `press` event on 'Create Network' button
		 * Open Dialog for a new Network creation
		 * @param {sap.ui.base.Event} oEvent - The `press` event
		 */
		onPressCreateNewNetwork: function (oEvent) {
			var oView = this.getView();

			if (this.oViewModel.getProperty("/pendingChanges")) {
				var sTitle = this.getResourceBundle().getText("btn.confirm"),
					sMsg = this.getResourceBundle().getText("msg.leaveWithoutSave");

				var successFn = function () {
					var oBackupDataCopy = deepClone(this.oBackupData);
					this.refreshGanttModel(oBackupDataCopy, true);
					this.oViewModel.setProperty("/pendingChanges", false);
					this.getOwnerComponent().NewNetworkDialog.open(oView, this.oNetworkSelection);
				};
				this.showConfirmDialog(sTitle, sMsg, successFn.bind(this));
			} else {
				this.getOwnerComponent().NewNetworkDialog.open(oView, this.oNetworkSelection);
			}
		},

		/**
		 * Value help request for the network selection
		 * @param {sap.ui.base.Event} oEvent - The `press` event
		 */
		onNetworkValueHelpRequested: function (oEvent) {
			var oView = this.getView(),
				oSource = oEvent.getSource(),
				mCustomData = oSource.data(),
				oModel = this.getModel();

			oModel.getMetaModel().loaded().then(function () {
				var oMetaModel = oModel.getMetaModel() || oModel.getProperty("/metaModel"),
					oEntitySet = oMetaModel.getODataEntitySet("WONetworkHeaderSet"),
					oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);

				var oProperty = oMetaModel.getODataProperty(oEntityType, mCustomData.property);
				if (oProperty !== null) {
					var aValueList = oProperty["com.sap.vocabularies.Common.v1.ValueList"];
					if (aValueList) {
						var aValueListParameter = aValueList["Parameters"];

						mCustomData["entitySet"] = aValueList.CollectionPath["String"];
						mCustomData["vhSet"] = aValueList.CollectionPath["String"];

						// load fragment 
						this.getOwnerComponent().NetworkSelection.open(oView, oSource, mCustomData, aValueListParameter);
					}
				}

			}.bind(this));
		},

		/**
		 * change event for network selection
		 * @param {sap.ui.base.Event} oEvent - The `press` event
		 */
		onChangeNetwork: function (oEvent) {
			var svalue = oEvent.getParameter("value");

			if (this.oViewModel.getProperty("/pendingChanges")) {
				var sTitle = this.getResourceBundle().getText("btn.confirm"),
					sMsg = this.getResourceBundle().getText("msg.leaveWithoutSave");

				var successFn = function () {
					var oBackupDataCopy = deepClone(this.oBackupData);
					this.refreshGanttModel(oBackupDataCopy, true);
					this.oViewModel.setProperty("/pendingChanges", false);
					this._getGanttdata(svalue);
				};
				var errorFn = function () {
					var sNetworkKey = this.oBackupData.NETWORK_KEY;
					this.oNetworkSelection.setValue(sNetworkKey);
				};

				this.showConfirmDialog(sTitle, sMsg, successFn.bind(this), errorFn.bind(this));
			} else {
				oEvent.getSource().setValue(svalue);
				this._getGanttdata(svalue);
			}
		},

		/**
		 * Function to handle save of updated network
		 * prepare batch for each rows of the table
		 */
		onPressNetworkSave: function (oEvent) {
			var oModelData = this.getModel("ganttModel").getData();
			var oPayloadData = {};
			oPayloadData = deepClone(oModelData);
			oPayloadData.VALIDATION_INDICATOR = false;
			this.saveNetworkChanges(oPayloadData, this._saveSuccessFn.bind(this), this._saveErrorFn.bind(this));
		},

		/**
		 * get gantt table data
		 * @private
		 * @param sNetworkId
		 */
		_getGanttdata: function (sNetworkId) {
			var oTempModel = this.getModel("templateProperties"),
				mTabs = oTempModel.getProperty("/GanttConfigs"),
				sEntitySet = mTabs.headerEntitySet;
			this.oViewModel.setProperty("/gantBusy", true);

			var sPath = sEntitySet + "('" + sNetworkId + "')";
			this.getOwnerComponent().readData("/" + sPath, [], {
				$expand: "NetworkHeaderToOperations,NetworkHeaderToOperations/NetworkOperationsToGantt"
			}).then(function (oResult) {
				this.oBackupData = deepClone(oResult);
				this.oUpdatedBackupData = deepClone(oResult);
				this.refreshGanttModel(oResult, true);
				this.oViewModel.setProperty("/gantBusy", false);
			}.bind(this), function (error) {
				this.oBackupData = null;
				this.refreshGanttModel({}, true);
				this.oViewModel.setProperty("/gantBusy", false);
			}.bind(this));
		},

		/**
		 * Handle to sort and delete functionality
		 * @private
		 * @param iDraggedPath index of where it placed before change
		 * @param iDroppedPath index of where to place after change
		 * @param [aDraggedOrderOperations] Copied order operation data
		 */
		_tablSortAndDelete: function (iDraggedPath, iDroppedPath, aDraggedOrderOperations) {
			var oModel = this.getModel("ganttModel"),
				oOperations = oModel.getProperty("/NetworkHeaderToOperations"),
				oData = oOperations.results,
				DraggedData = [];
			if (iDraggedPath && oData.length) {
				DraggedData = oData.splice(iDraggedPath, 1)[0];
			}
			if (aDraggedOrderOperations) {
				DraggedData = aDraggedOrderOperations;
			}

			if (iDroppedPath && DraggedData.length) {
				DraggedData.forEach(function (oDragged) {
					oData.splice(iDroppedPath, 0, oDragged);
					iDroppedPath++;
				}.bind(this));
			} else if (iDroppedPath) {
				oData.splice(iDroppedPath, 0, DraggedData);
			}
			this._updateSortandRelationshipSequence(oData);
			this.oViewModel.setProperty("/GanttRowCount", oData.length);
			oModel.refresh();

			//sort/delete code
			this.validateNetworkOperations(oModel.getData());
		},

		/**
		 * update sort id and relationship after each sort/delete functionality
		 * Formatter used to format the sortid as 3 digit
		 * @private
		 * @param [aData] gantt table data
		 */
		_updateSortandRelationshipSequence: function (aData) {
			for (var i = 0; i < aData.length; i++) {
				var sSortId = formatter.formatOperationNumber((i + 1).toString(), 3);
				aData[i].SORT_ID = sSortId;

				aData[i].NetworkOperationsToGantt.results[0] = {};

				var obj = aData[i].NetworkOperationsToGantt.results[0];
				if (i === aData.length - 1) {
					aData[i].REL_KEY = "";
					aData[i].RELATION_TYPE = "";
				} else {
					if (aData[i].ObjectKey === "") {
						aData[i].ObjectKey = aData[i].ORDER_NUMBER + "_" + aData[i].OPERATION_NUMBER + "_" + aData[i].SORT_ID + aData[i].SORT_ID + aData[
							i].ORDER_NUMBER + aData[i].OPERATION_NUMBER;
					}
					aData[i].REL_KEY = aData[i].REL_KEY ? aData[i].REL_KEY : this.getModel("user").getProperty("/DEFAULT_RELATION_KEY");
					aData[i].RELATION_TYPE = aData[i].RELATION_TYPE ? aData[i].RELATION_TYPE : "FS";

					obj.ObjectKey = aData[i].ObjectKey;
					obj.HeaderObjectKey = aData[i].ObjectKey;
					obj.NETWORK_KEY = aData[i].NETWORK_KEY;
					obj.SORT_ID = aData[i].SORT_ID;
					obj.ORDER_NUMBER = aData[i].ORDER_NUMBER;
					obj.OPERATION_NUMBER = aData[i].OPERATION_NUMBER;

					obj.SUC_OBJECT_KEY = aData[i].ObjectKey;
					obj.SUC_SORT_ID = aData[i].SORT_ID;
					obj.SUC_ORDER_NUMBER = aData[i].ORDER_NUMBER;
					obj.SUC_OPERATION_NUMBER = aData[i].OPERATION_NUMBER;

					obj.PRE_OBJECT_KEY = aData[i + 1].ObjectKey;
					obj.PRE_SORT_ID = aData[i + 1].SORT_ID;
					obj.PRE_ORDER_NUMBER = aData[i + 1].ORDER_NUMBER;
					obj.PRE_OPERATION_NUMBER = aData[i + 1].OPERATION_NUMBER;

					obj.REL_KEY = aData[i].REL_KEY;
				}
			}
		},

		/**
		 * Format dragged order operation details according to network operation details
		 * @private
		 * @param iDropPath  -- row number
		 * @param {oDrppedContext} -- dropped copied context
		 * @param [aDraggedContext] -- dragged context
		 */
		_getFormatedOrderOperation: function (iDropPath, oDroppedContext, aDraggedContext) {
			return new Promise(function (resolve) {
				var oDrdData = oDroppedContext.getObject();
				this.adddependencies(aDraggedContext, oDrdData).then(function (aFormatedOrderOperation) {
					resolve(aFormatedOrderOperation);
				}.bind(this));
			}.bind(this));
		},

		/**
		 * success callback after creating order
		 */
		_saveSuccessFn: function (OResponse) {
			this.getModel().refresh();
			if (OResponse && OResponse.ObjectKey && this.oNetworkSelection) {
				this.oViewModel.setProperty("/pendingChanges", false);
				this.oNetworkSelection.fireChange({
					value: OResponse.ObjectKey
				});
			}

			var msg = this.getResourceBundle().getText("msg.saveSuccess");
			this.showMessageToast(msg);
		},

		/**
		 * error callback after save
		 */
		_saveErrorFn: function () {

		}
	});
});