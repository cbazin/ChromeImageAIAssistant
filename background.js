chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "captureArea") {
        try {
            chrome.tabs.captureVisibleTab(null, {}, function (imageUri) {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                } else {
                    chrome.storage.local.get('openAIKey', function (data) {
                        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                action: "cropImage",
                                imageUri: imageUri,
                                coordinates: request.coordinates,
                                openAIKey: data.openAIKey  // Ajouter la clé API ici
                            });
                        });
                    });
                }
            });
        } catch (error) {
            console.error("Error while capturing area : ", error);
        }
    }
    if (request.action === "showNotification") {
        chrome.notifications.create('', {
            title: request.title,
            message: request.message,
            type: 'basic',
            iconUrl: 'icon.png' // Assurez-vous que cette icône existe
        });

    }
    if (request.action === "getOpenAIKey") {
        console.log("getOpenAPIkey");
        chrome.storage.local.get('openAIKey', function (data) {
            console.log("key found");
            if (data.openAIKey) {
                console.log("key: " + data.openAIKey);
                chrome.tabs.sendMessage(sender.tab.id, {
                    action: "receiveOpenAIKey",
                    key: data.openAIKey
                });
            } else {
                sendResponse({ error: 'Clé API non trouvée' });
            }
        });
    }
});


function showNotification(title, message) {
    chrome.notifications.create('', {
        title: title,
        message: message,
        type: 'basic',
        iconUrl: 'icon.png' // Assurez-vous d'avoir une icône appropriée
    }, function (notificationId) {
        console.log("Notification shown:", notificationId);
    });
}