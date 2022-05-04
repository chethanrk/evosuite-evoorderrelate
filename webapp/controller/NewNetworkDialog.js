sap.ui.define([
	"com/evorait/evosuite/evoorderrelate/controller/BaseController",
	"sap/ui/core/Fragment",
	"sap/ui/core/mvc/OverrideExecution",
	"com/evorait/evosuite/evoorderrelate/model/models",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"com/evorait/evosuite/evoorderrelate/model/formatter"
], function (BaseController, Fragment, OverrideExecution, models, Filter, FilterOperator, MessageBox, formatter) {
	"use strict";
	return BaseController.extend("com.evorait.evosuite.evoorderrelate.controller.NewNetworkDialog", {

		metadata: {
			// extension can declare the public methods
			// in general methods that start with "_" are private
			methods: {
				open: {
					public: true,
					final: false
				},

				onAfterCloseNewNetworkDialog: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.Before
				},

				onChangeOrderNumber: {
					public: true,
					final: true
				},

				onChangeOperationNumber: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.After
				},

				onSaveNewNetwork: {
					public: true,
					final: false,
					overrideExecution: OverrideExecution.Instead
				}
			}
		},

		_oNewNetworkDialog: null,
		_oNewNetworkSmartForm: null,
		_oComponent: null,
		_oView: null,
		_oOperationNumberCombobox: null,
		_oContext: null,
		_oNeteorkSelection: null,

		/**
		 * Open the New Network Dialog. Fill internal properties, add the dialog as dependent to the provided view.
		 * @param {sap.ui.core.mvc.View} oView - Parent view, where the dialog is opened
		 */
		open: function (oView, oNetworkSelect) {
			// init internal properties
			this._oComponent = oView.getController().getOwnerComponent();
			this._oView = oView;
			this._oController = oView.getController();
			this._oNeteorkSelection = oNetworkSelect;
			// lazy loading
			if (!this._oNewNetworkDialog) {
				Fragment.load({
					name: "com.evorait.evosuite.evoorderrelate.view.fragments.NewNetworkDialog",
					type: "XML",
					controller: this
				}).then(function (oDialog) {
					this._oNewNetworkDialog = oDialog;
					this._oNewNetworkDialog.addStyleClass(this._oComponent.getContentDensityClass());
					oView.addDependent(oDialog);
					this._oNewNetworkSmartForm = sap.ui.getCore().byId("idNewNetworkSmartForm");
					this._bindDialog();
					this._oNewNetworkDialog.open();
				}.bind(this));
			} else {
				this._bindDialog();
				this._oNewNetworkDialog.open();
			}
		},

		/**
		 * Handle `press` event on 'Close' button
		 * Close the dialog
		 * @param {sap.ui.base.Event} oEvent - the `press` event
		 */
		onCloseNewNetworkDialog: function (oEvent) {
			this._oNewNetworkDialog.close();
		},

		/**
		 * Handle the dialog 'afterClose' event
		 * @param {sap.ui.base.Event} oEvent - the `afterClose` event
		 */
		onAfterCloseNewNetworkDialog: function (oEvent) {
			if (this._oController.getModel().hasPendingChanges()) {
				this._oController.getModel().resetChanges([this._oNewNetworkDialog.getBindingContext().getPath()]);
			}
			if (this._oOperationNumberCombobox) {
				this._oOperationNumberCombobox.unbindItems();
				this._oOperationNumberCombobox.setEnabled(false);

			}
		},

		/**
		 * Handle the 'change' event for Order Number field
		 * Reset Operation Number model value; initiate replacement of the Operation Number SmartField with sap.m.ComboBox Control
		 * @param {sap.ui.base.Event} oEvent - the `change` event
		 */
		onChangeOrderNumber: function (oEvent) {
			var oSource = oEvent.getSource();
			var oContext = oSource.getBindingContext();
			var mParams = JSON.parse(JSON.stringify(oContext.getObject()));

			var sPath = oContext.getPath();
			this._oController.getModel().resetChanges([sPath + "/OPERATION_NUMBER"]);
			this._oController.getModel().resetChanges([sPath + "/NETWORK_COUNTER"]);
			if (oSource.getValueState() === "None" && oContext) {
				var oField = sap.ui.getCore().byId("idNewNetworkOperationNumber");

				if (oField) {
					this._replaceSmartFieldWithDropdown(oField, mParams);
				}
			}
		},

		/**
		 * Handle the 'change' event for Operation Number field
		 * Validate the field using function import 'CheckIfNetworkExists'; display error in case the Network exists already
		 * @param {sap.ui.base.Event} oEvent - the `change` event
		 */
		onChangeOperationNumber: function (oEvent) {
			var oSource = oEvent.getSource(),
				oContext = oSource.getBindingContext(),
				sOrderNUmber = oContext.getProperty("ORDER_NUMBER"),
				sOpeationNUmber = oContext.getProperty("OPERATION_NUMBER");

			if (sOrderNUmber && sOpeationNUmber) {
				oSource.setValueState("None");

				var aFilters = [];
				aFilters.push(new Filter("ORDER_NUMBER", FilterOperator.EQ, sOrderNUmber));
				aFilters.push(new Filter("OPERATION_NUMBER", FilterOperator.EQ, sOpeationNUmber));
				aFilters.push(new Filter("VALIDATION_INDICATOR", FilterOperator.EQ, true));

				var oFilter = new Filter({
					filters: aFilters,
					and: true
				});

				this._validateNetwork(oFilter);
			}

		},

		/**
		 * Handle `press` event of the 'Save' button
		 * @param {sap.ui.base.Event} oevent - the `press` event
		 */
		onSaveNewNetwork: function (oEvent) {
			if (this._oView.getModel().hasPendingChanges()) {
				var mErrors = this._validateForm();
				this._saveChanges(mErrors, this._saveCreateSuccessFn.bind(this), this._saveErrorFn.bind(this));
			}
		},

		/* =========================================================== */
		/* internal methods                                              */
		/* =========================================================== */

		/**
		 * Send the Form field values to backend
		 * @param mParams
		 * @param oSuccessCallback
		 * @param oErrorCallback
		 */
		_saveChanges: function (mParams, oSuccessCallback, oErrorCallback) {
			if (mParams.state === "success") {
				this._oNewNetworkDialog.setBusy(true);

				this._oView.getModel().submitChanges({
					success: function (oResponse) {

						if (oResponse.__batchResponses && oResponse.__batchResponses[0].response && oResponse.__batchResponses[0].response.statusCode ===
							"400") {
							if (oErrorCallback) {
								oErrorCallback(oResponse);
							}
						} else {
							if (oSuccessCallback) {
								oSuccessCallback(oResponse);
							}
						}
					}.bind(this),
					error: function (oError) {
						this._oNewNetworkDialog.setBusy(false);
						this.showSaveErrorPrompt(oError);
						if (oErrorCallback) {
							oErrorCallback(oError);
						}
					}.bind(this)
				});
			} else if (mParams.state === "error") {

			}
		},

		/**
		 * validation for new network
		 * add counter value to NETWORK_COUNTER property
		 * @param filters
		 */
		_validateNetwork: function (oFilters) {
			this._oNewNetworkDialog.setBusy(true);
			this._oComponent.readData("/WONetworkHeaderSet/$count", [oFilters], {}).then(function (oResult) {
				if (oResult) {
					var iCount = parseInt(oResult, 10);
					if (iCount) {
						var sCounter = formatter.formatOperationNumber((iCount).toString(), 2);
						this._oView.getModel().setProperty(this._oContext.getPath() + "/NETWORK_COUNTER", sCounter);
						this._displayValidationText(sCounter);
					} else {
						this._oView.getModel().setProperty(this._oContext.getPath() + "/NETWORK_COUNTER", "00");
					}
				}
				this._oNewNetworkDialog.setBusy(false);
			}.bind(this), function (error) {
				this._oNewNetworkDialog.setBusy(false);
			}.bind(this));

		},

		/**
		 * Bind the dialog with a new created Network instance
		 */
		_bindDialog: function () {
			this._oContext = this._oController.getModel().createEntry("/" + "WONetworkHeaderSet");
			this._oNewNetworkDialog.bindElement(this._oContext.getPath());
		},

		/**
		 * replace smartField valueHelper with a dropdown control sap.m.ComboBox
		 * the valueHelp data context will be saved for this ComboBox control in viewModel
		 * sFieldNameId is unique from field name and view name & Id
		 * 
		 * When ComboBox was implemented just refresh inside filters 
		 * so all filters from valueHelp are added to ComboBox items
		 * @param oField
		 * @param mFilterIds
		 */
		_replaceSmartFieldWithDropdown: function (oField, mFilterIds) {
			var oParent = oField.getParent(),
				sFieldName = oField.getName(),
				sFieldId = oField.getId(),
				oDataProperties = this._oView.getModel("viewModel").getProperty("formHandling/newNetWorkDialog");

			if (oField instanceof sap.m.ComboBox && oDataProperties) {
				this._setNewSelectItemsBinding(oField, oDataProperties, mFilterIds);

			} else if (oField instanceof sap.ui.comp.smartfield.SmartField) {
				oDataProperties = oField.getDataProperty();
				this._oView.getModel("viewModel").setProperty("formHandling/newNetWorkDialog", oDataProperties);

				var sLabel = oDataProperties.property["sap:label"];
				if (oDataProperties.property["com.sap.vocabularies.Common.v1.Label"]) {
					sLabel = oDataProperties.property["com.sap.vocabularies.Common.v1.Label"].String;
				}
				var oCtrl = sap.ui.getCore().byId(sFieldId + "replaced");
				if (!oCtrl) {
					oCtrl = new sap.m.ComboBox({
						id: sFieldId + "replaced",
						name: sFieldName,
						required: oField.getMandatory(),
						fieldGroupIds: "CustomFormField",
						selectedKey: "{OPERATION_NUMBER}",
						change: this.onChangeOperationNumber.bind(this)
					});
					if (oParent.addElement) {
						oParent.removeElement(oField);
						oParent.addElement(oCtrl);
						oParent.setLabel(sLabel);
						this._oOperationNumberCombobox = oCtrl;
					}
				} else {
					oCtrl.setEnabled(true);
				}
				this._setNewSelectItemsBinding(oCtrl, oDataProperties, mFilterIds);
			}
		},

		/**
		 * rebind dropdown items based on valueHelp annotations
		 * read from old field annotation parmaeters In and Out and generate filters
		 * @param oField
		 * @param oDataProperties
		 * @param mFilterIds
		 */
		_setNewSelectItemsBinding: function (oField, oDataProperties, mFilterIds) {
			var oValueHelpProps = oDataProperties.property["com.sap.vocabularies.Common.v1.ValueList"];

			if (oValueHelpProps) {
				var sBindingPath = oValueHelpProps.CollectionPath.String,
					sTextProp = "",
					sKeyProp = "",
					aFilters = [];

				oValueHelpProps.Parameters.forEach(function (oProp) {
					if (oProp.RecordType === "com.sap.vocabularies.Common.v1.ValueListParameterIn") {
						var oFilter = new Filter(oProp.ValueListProperty.String, sap.ui.model.FilterOperator.EQ, mFilterIds[oProp.LocalDataProperty
							.PropertyPath]);
						aFilters.push(oFilter);
						sTextProp = oProp.ValueListProperty.String;
					} else if (oProp.RecordType === "com.sap.vocabularies.Common.v1.ValueListParameterInOut") {
						sKeyProp = oProp.ValueListProperty.String;

					}
				});

				if (sTextProp && sKeyProp) {
					var oItemTemplate = new sap.ui.core.ListItem({
						text: "{" + sKeyProp + "}",
						key: "{" + sKeyProp + "}"
					});

					oField.bindAggregation("items", {
						path: "/" + sBindingPath,
						template: oItemTemplate,
						filters: aFilters
					});
				}
			}
		},

		/**
		 * Validate smartForm with custom fields
		 */
		_validateForm: function () {
			var aCustomFields = this._oNewNetworkSmartForm.getControlsByFieldGroupId("CustomFormField"),
				validatedSmartFields = [];

			var validatedSmartFields = this._oNewNetworkSmartForm.check();

			var isValid = validatedSmartFields.length === 0,
				invalidFields = validatedSmartFields;

			//validate custom input fields
			for (var i = 0; i < aCustomFields.length; i++) {
				if (aCustomFields[i].getValue) {
					var sValue = aCustomFields[i].getValue();
					try {
						if (aCustomFields[i].getRequired() && aCustomFields[i].getEditable() && (!sValue || sValue.trim() === "")) {
							aCustomFields[i].setValueState(sap.ui.core.ValueState.Error);
							isValid = false;
							invalidFields.push(aCustomFields[i]);
						} else {
							aCustomFields[i].setValueState(sap.ui.core.ValueState.None);
						}
					} catch (e) {
						//do nothing
					}
				}
			}

			if (isValid) {
				return {
					state: "success"
				};
			} else {
				return {
					state: "error",
					fields: invalidFields
				};
			}
		},

		/**
		 * success callback after creating order
		 */
		_saveCreateSuccessFn: function (OResponse) {
			this._oView.getModel().refresh();
			var msg = this._oController.getResourceBundle().getText("msg.saveSuccess");
			this._oController.showMessageToast(msg);
			var oData = this.getBatchChangeResponse(OResponse);
			if (oData && oData.ObjectKey && this._oNeteorkSelection) {
				this._oNeteorkSelection.fireChange({
					value: oData.ObjectKey
				});
			}
			this._oNewNetworkDialog.setBusy(false);
			this._oNewNetworkDialog.close();
		},

		/**
		 * error callback after save
		 */
		_saveErrorFn: function () {
			this._oNewNetworkDialog.setBusy(false);
		},

		/*
		 * Display warning messaage
		 * Network validation warning message
		 * iCounter  counter value
		 */
		_displayValidationText: function (iCounter) {
			var oResourceBundle = this._oView.getModel("i18n").getResourceBundle(),
				title = oResourceBundle.getText("tit.networkValidation"),
				sMsg = oResourceBundle.getText("msg.netWorkValidationMsg", iCounter);

			MessageBox.warning(sMsg, {
				title: title,
				actions: [MessageBox.Action.OK]
			});
		}

	});
});