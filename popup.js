document.getElementById('capture').addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "startCapture" });
    });
});

document.getElementById('copy-text').addEventListener('click', function () {
    const responseText = document.getElementById('api-response').textContent;
    navigator.clipboard.writeText(responseText).then(() => {
        console.log('Texte copié dans le presse-papiers !');
    }).catch(err => {
        console.error('Erreur lors de la copie :', err);
    });
});

// Lorsque le popup est ouvert, récupérez l'image du stockage local
window.onload = function () {
    chrome.storage.local.get("lastImage", function (items) {
        if (items.lastImage) {
            const imageElement = document.getElementById('last-captured-image');
            imageElement.src = items.lastImage;
        }
    });


    chrome.storage.local.get("lastChatGPTResponse", function (items) {
        if (items.lastChatGPTResponse) {
            const responseElement = document.getElementById('api-response');
            responseElement.textContent = items.lastChatGPTResponse;
        }
    });
};