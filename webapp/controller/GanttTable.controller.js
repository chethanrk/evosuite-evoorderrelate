/* globals moment */
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
		oGanttModel: null,
		oNetworkSelection: null,

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.evorait.evosuite.evoorderrelate.view.GanttTable
		 */
		onInit: function () {
			this.oViewModel = this.getModel("viewModel");
			this.oGanttModel = this.getModel("ganttModel");
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
				this.validateNetworkOperations(this.oGanttModel.getData());
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
			var sMsg = this.getResourceBundle().getText("msg.notAuthorizedForCreate");
			if (this.getModel("viewModel").getProperty("/authorizeCheck") && !this.getModel("user").getProperty("/ENABLE_IW32_AUTH_CHECK")) {
				this.showMessageToast(sMsg);
				oEvent.preventDefault();
				return;
			}
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
				this.oUpdatedBackupData = deepClone(this.oBackupData);
				this.refreshGanttModel(deepClone(this.oBackupData));
				this.oViewModel.setProperty("/pendingChanges", false);
				this.deleteNetwork(deepClone(this.oBackupData));
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
				this.oUpdatedBackupData = deepClone(this.oBackupData);
				this.refreshGanttModel(deepClone(this.oBackupData));
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
					this.refreshGanttModel(deepClone(this.oBackupData));
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
					this.refreshGanttModel(deepClone(this.oBackupData));
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
			var oPayloadData = {};
			oPayloadData = deepClone(this.oGanttModel.getData());
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
				this.refreshGanttModel(oResult);
				this._setGanttTimeHorizon();
				this.oViewModel.setProperty("/gantBusy", false);
			}.bind(this), function (error) {
				this.oBackupData = null;
				this.refreshGanttModel({});
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
			var oOperations = this.oGanttModel.getProperty("/NetworkHeaderToOperations"),
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
			this._formatValidationData(oData);
		},

		/**
		 * Adjust Sortid and prapare date for the validation
		 * @param oData network operatio
		 */
		_formatValidationData: function (oData) {
			//adjust sortid
			var iCounter = 1;
			oData.forEach(function (data) {
				//Formatter used to format the sortid as 3 digit
				data.SORT_ID = formatter.formatOperationNumber((iCounter).toString(), 3);
				data.ObjectKey = this._getLocalObjectKey(data.ORDER_NUMBER, data.OPERATION_NUMBER, data.SORT_ID);
				iCounter++;
			}.bind(this));

			//update sequesnce with relationship
			this._updateRelationshipSequence(oData).then(function (formattedData) {
				this.oViewModel.setProperty("/GanttRowCount", oData.length);

				var modelData = this.oGanttModel.getData();
				modelData.NetworkHeaderToOperations = formattedData;
				//sort/delete code
				this.validateNetworkOperations(modelData);
			}.bind(this));
		},

		/**
		 * update relationship after each sort/delete functionality
		 * @private
		 * @param [aData] gantt table data
		 */
		_updateRelationshipSequence: function (aData) {
			return new Promise(function (resolve) {
				var iIndex = 0,
					newArray = [];
				aData.forEach(function (data) {
					data.NetworkOperationsToGantt.results[0] = {};
					var obj = data.NetworkOperationsToGantt.results[0];

					if (iIndex === aData.length - 1) {
						data.REL_KEY = "";
						data.RELATION_TYPE = "";
						newArray.push(deepClone(data));
						return;
					}

					data.REL_KEY = data.REL_KEY ? data.REL_KEY : this.getModel("user").getProperty("/DEFAULT_RELATION_KEY");
					data.RELATION_TYPE = data.RELATION_TYPE ? data.RELATION_TYPE : this.getModel("user").getProperty("/DEFAULT_RELATION_TYPE");
					obj.REL_KEY = data.REL_KEY;

					obj.ObjectKey = data.ObjectKey;
					obj.HeaderObjectKey = data.ObjectKey;
					obj.NETWORK_KEY = data.NETWORK_KEY;
					obj.SORT_ID = data.SORT_ID;
					obj.ORDER_NUMBER = data.ORDER_NUMBER;
					obj.OPERATION_NUMBER = data.OPERATION_NUMBER;
					if (data.AOB_KEY === "2") {
						this._setDataBasedOnScheduleType(obj, data, aData[iIndex + 1]);
					} else if (data.AOB_KEY === "1") {
						this._setDataBasedOnScheduleType(obj, aData[iIndex + 1], data);
					}
					iIndex++;
					newArray.push(deepClone(data));
				}.bind(this));
				resolve(newArray);
			}.bind(this));
		},

		/**
		 * Set data based on Predecessor and Successor type
		 * @param {oNewOprData} new operation data
		 * @param {oOprData} existing operation data
		 * @param {oNetworkData} next operation detail
		 */
		_setDataBasedOnScheduleType: function (oNewOprData, oOprData, oNetworkData) {
			oNewOprData.SUC_OBJECT_KEY = oOprData.ObjectKey;
			oNewOprData.SUC_SORT_ID = oOprData.SORT_ID;
			oNewOprData.SUC_ORDER_NUMBER = oOprData.ORDER_NUMBER;
			oNewOprData.SUC_OPERATION_NUMBER = oOprData.OPERATION_NUMBER;

			oNewOprData.PRE_OBJECT_KEY = oNetworkData.ObjectKey;
			oNewOprData.PRE_SORT_ID = oNetworkData.SORT_ID;
			oNewOprData.PRE_ORDER_NUMBER = oNetworkData.ORDER_NUMBER;
			oNewOprData.PRE_OPERATION_NUMBER = oNetworkData.OPERATION_NUMBER;
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

		},

		/**
		 * To adjust gantt time horizon of gantt control
		 */
		_setGanttTimeHorizon: function () {
			var oData = this.getModel("ganttModel").getData(),
				oStartDate = this.oViewModel.getProperty("/visibleHorizon/visibleStartDate"),
				sEndDate;

			if (oData.NetworkHeaderToOperations && oData.NetworkHeaderToOperations.results && oData.NetworkHeaderToOperations.results.length) {
				var oOpeartions = oData.NetworkHeaderToOperations.results;
				oOpeartions.forEach(function (opr) {
					if (oStartDate.getTime() > opr.EARLIEST_START_DATE.getTime()) {
						oStartDate = opr.EARLIEST_START_DATE;
					}
				});

				var date = moment(oStartDate);
				oStartDate = date.startOf("day").subtract(1, "day").toDate();
				sEndDate = date.endOf("day").add(1, "months").toDate();

				var oAxisTimeStrategy = this.getView().byId("idOrderRelatePlanGanttZoom");
				//Setting VisibleHorizon for Gantt for supporting Patch Versions (1.71.35)
				if (oAxisTimeStrategy) {
					oAxisTimeStrategy.setVisibleHorizon(new sap.gantt.config.TimeHorizon({
						startTime: oStartDate,
						endTime: sEndDate
					}));
				} else {
					this.oViewModel.setProperty("/ganttSettings/visibleStartTime", oStartDate);
					this.oViewModel.setProperty("/ganttSettings/visibleEndTime", sEndDate);
				}
			}
		}
	});
});