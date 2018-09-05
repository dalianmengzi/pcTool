/**
 * 下载回调 
 * @param {Object} success
 */
function cb_download(success) {
	console.log(success);
	if (success && window.operateDoc) {
		operateDoc.begin(operateDoc.action);
	} else {
		operateDoc.action.noInternet = false;
		socketIO.openDoc(operateDoc.action);
	}
}