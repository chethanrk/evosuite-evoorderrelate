sap.ui.define([],
	function () {
		"use strict";

		/**
		 * exclude annotationPath and entitySet
		 * for further functionality
		 * @private
		 */
		var _getAnnotationPath = function (oAnnotationPathContext) {
			var oAnnotationObj = oAnnotationPathContext.getObject(),
				sAnnotationPath, sEntitySet, sAnnotationHeadPath;

			if (typeof oAnnotationObj === "string") {
				sAnnotationPath = oAnnotationObj;
			} else {
				sAnnotationPath = oAnnotationObj.path;
				sEntitySet = oAnnotationObj.entitySet;
				sAnnotationHeadPath = oAnnotationObj.headerPath;
			}
			return {
				entitySet: sEntitySet,
				path: sAnnotationPath,
				headerPath: sAnnotationHeadPath
			};
		};

		/**
		 * get annotation binding context for object page
		 * content OR header
		 * @private
		 */
		var _resolveObjectPagePath = function (oAnnotationPathContext, sPathPropertyName) {
			var oModel = oAnnotationPathContext.getModel(),
				oData = _getAnnotationPath(oAnnotationPathContext),
				oAnnotationByPath = getAnnotationByPath(oData[sPathPropertyName], oData.entitySet, oModel),
				oBindingPath = _createBindingContext(oAnnotationPathContext, sPathPropertyName);

			if (!oAnnotationByPath) {
				var splittedAnno = oData[sPathPropertyName].split("#"),
					sQualifier = splittedAnno[1],
					sNewAnnoPath = splittedAnno[0];

				sQualifier = sQualifier.slice(0, sQualifier.lastIndexOf("_"));
				oAnnotationPathContext.getObject()[sPathPropertyName] = sNewAnnoPath + "#" + sQualifier;
				oBindingPath = _createBindingContext(oAnnotationPathContext, sPathPropertyName);
			}
			return oBindingPath;
		};

		/**
		 * create context binding based on annotation path
		 * context from metadata model
		 * @private
		 */
		var _createBindingContext = function (oAnnotationPathContext, sPathPropertyName) {
			var oAnnotationObj = oAnnotationPathContext.getObject(),
				oData = _getAnnotationPath(oAnnotationPathContext);

			var oModel = oAnnotationPathContext.getModel();
			var oMetaModel = oModel.getMetaModel() || oModel.getProperty("/metaModel");
			var oEntitySet = oMetaModel.getODataEntitySet(oData.entitySet ? oData.entitySet : oModel.getProperty("/tempData/entitySet"));
			var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
			return oMetaModel.createBindingContext(oEntityType.$path + "/" + oData[sPathPropertyName]);
		};

		/**
		 * resolve annotation path saved in JsonModel
		 * @public
		 */
		var resolveModelPath = function (oAnnotationPathContext) {
			return _createBindingContext(oAnnotationPathContext, "path");
		};

		/**
		 * get annotation context by qualifier with splitter "_"
		 * for object page header content
		 * checks if there are annoations available or not
		 * @public
		 */
		var resolveObjectHeaderPath = function (oAnnotationPathContext) {
			return _resolveObjectPagePath(oAnnotationPathContext, "headerPath");
		};

		/**
		 * get annotation context by qualifier with splitter "_"
		 * for object page content
		 * checks if there are annoations available or not
		 * @public
		 */
		var resolveObjectContentPath = function (oAnnotationPathContext) {
			return _resolveObjectPagePath(oAnnotationPathContext, "path");
		};

		/**
		 * get property name from path
		 * @public
		 */
		var getPathName = function (oInterface) {
			return oInterface ? oInterface.Path : undefined;
		};

		/**
		 * get entityType name from path
		 * for setting smartField property name
		 * @public
		 */
		var getSmartFieldName = function (oInterface) {
			var sPathName = getPathName(oInterface);
			return sPathName ? "id" + sPathName : undefined;
		};

		var getAnnotationByPath = function (sAnnotationPath, sEntitySet, oModel) {
			var oMetaModel = oModel.getMetaModel() || oModel.getProperty("/metaModel"),
				oEntitySet = oMetaModel.getODataEntitySet(sEntitySet),
				oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
			return oEntityType[sAnnotationPath];
		};

		var isInNavLinks = function (sValue, mNavLinks) {
			if (mNavLinks.hasOwnProperty(sValue)) {
				return true;
			}
			return null;
		};

		return {
			resolveModelPath: resolveModelPath,
			resolveObjectHeaderPath: resolveObjectHeaderPath,
			resolveObjectContentPath: resolveObjectContentPath,
			getPathName: getPathName,
			getSmartFieldName: getSmartFieldName,
			getAnnotationByPath: getAnnotationByPath,
			isInNavLinks: isInNavLinks
		};

	},
	/* bExport= */
	true);