document.getElementById('save').addEventListener('click', function () {
    var apiKey = document.getElementById('api-key').value;
    chrome.storage.local.set({ 'openAIKey': apiKey }, function () {
        console.log('API Key saved');
    });
});