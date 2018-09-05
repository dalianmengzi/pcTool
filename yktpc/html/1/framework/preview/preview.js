//预览资源和视频
function previewDoc(content, data, action) {
    var url = JSON.parse(data.url),
        operateDoc = null;

    if (!url) {
        return;
    }

    screenTransform(action.screen);

    var historysRealy = [];

    //获取的在历史记录
    if (action.pens) {
        var historys = action.pens;
        for (var prop in historys) {
            if (!isNaN(prop)) {
                var path = historys[prop];
                historysRealy[prop - 1] = path;
            }
        }
    }

    switch (url.category) {
        case 'video':
            operateDoc = Video.init(data, content);
            break;
        case 'img':
            url.urls.previewUrl = url.urls.preview;
            operateDoc = new Office();

            operateDoc.init(1, url, content, historysRealy, action.screen, false);

            break;
        case "code":
        case 'office':
            if (url.isH5 >0) {
                OfficeHtml.init(action.page, url.h5PreviewUrl, content, historysRealy, action);
                operateDoc = OfficeHtml;
            } else {
                url.urls.previewUrl = url.urls.status.replace("status", "[place]");
                operateDoc = new Office();
                operateDoc.init(action.page, url, content, historysRealy, action.screen);
            }
            break;
        case 'mp3':
			if (url.urls.preview_oss_gen == "") {
				url.urls.previewUrl = url.urls.preview;
			} else {
				url.urls.previewUrl = url.urls.preview_oss_gen;
			}
            Audio.init(url.urls.previewUrl);
            operateDoc = Audio;
            break;
    }

    window.operateDoc = operateDoc;
    operateDoc.action = action;

    return operateDoc;
}

/**
 * 屏幕大小的转换
 * @param {Object} screen
 */
function screenTransform(screen) {
    window.screenTemp = {};
    window.mobileScreen = {};

    if (screen) {
        mobileScreen = screen;

        screenTemp.width = window.screen.width;
        screenTemp.height = window.screen.width / screen.width * screen.height;
    }
}

/**
 * 没网时的预览
 * @param {Object} content
 * @param {Object} action
 */
function previewDocNoInternet(content, action) {
    var operateDoc,
        localServer = "../../../data/upload/";

    screenTransform(action.screen);

    //加载中。。。
    var loading = $("<div id = 'loading' class='loading'></div>");
    content.html(loading);

    switch (action.category) {
        case "img":
            var urls = {};
            urls.previewUrl = localServer + "[place]";
            operateDoc = new Office();
            operateDoc.imgs = [action.uploadUrl];

            operateDoc.init(1, {
                urls: urls
            }, content, [], action.screen, true);

            break;
        case "office":
            var fileName = action.uploadUrl;
            if (!fileName.endsWith(".zip")) {
                fileName = fileName + ".zip";
            }
            if (action.hasZip) {
                //发送指令打开ppt
                OfficeHtml.content = content;
                OfficeHtml.name = fileName;
                OfficeHtml.historyPen = [];
                OfficeHtml.historys = [];
                if (action.page > 0) {
                    OfficeHtml.currentIndex = action.page - 1;
                }
                operateDoc = OfficeHtml;
            } else {

                action.previewUrl = "../../../data/" + fileName.replace(".", "_") + "/[place]";

                action.imgs = [];

                for (var i = 0; i < action.count; i++) {
                    action.imgs[i] = "0.0." + (i + 1) + ".png";
                }
                operateDoc = new Office();
            }

            var downloadUrl = action.dataPath + action.uploadUrl;

            cef.message.sendMessage("win32.unzip", [downloadUrl, fileName]);
            break;
        case "video":
            var videoUrl = localServer + action.uploadUrl;

            Video.init({
                videoUrl: videoUrl
            }, content);
            operateDoc = Video;
            break;
        case "mp3":
            var previewUrl = action.uploadUrl;
            console.log(previewUrl);
            //if (!previewUrl.startsWith("http://")) {
            //    previewUrl = localServer + previewUrl;
            //}

            Audio.init(previewUrl);
            operateDoc = Audio;
            break;
    }

    window.operateDoc = operateDoc;
    operateDoc.action = action;

    return operateDoc;
}

/**
 * 预览windowppt
 * @param {Object} action
 */
function previewWindow(action) {
    var operateDoc = WindowPPT;
    operateDoc.open(action);
    return operateDoc;
}

/**
 * 查看富文本
 */
function viewHtml(content, html) {

    var width = window.screen.width;

    if (width < 1200) {
        width *= 0.9;
    } else {
        width *= 0.8;
    }

    var wrap = $('<div class = "activity-html-wrap"></div>');

    wrap.html(html);
    content.html(wrap);

    wrap.find("img").css({
        width: '90%',
        height: 'auto'
    });

    var documentHeight = 0;
    var imgs = $(".activity-html-wrap img"),
        imgsCount = imgs.length,
        loadedImgs = 0;

    if (imgsCount > 0) {
        imgs.load(function() {
            loadedImgs++;
            if (loadedImgs == imgsCount) {
                documentHeight = wrap.height() * 2;
                wrap.css("top", wrap.height() / 2);
            }
        })
    }

    var HtmlTool = {
        classType: "HtmlTool",
        scrollTo: function(position) {
            var top = position / 100 * documentHeight;
            if (top < 0) {
                top = 0;
            }
            $('html,body').animate({
                scrollTop: top
            });
        }
    }

    $('.main-box').css('background', '#1c1c1c');

    return HtmlTool;
}