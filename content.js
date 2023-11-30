chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "startCapture") {
        createOverlay();
    }
});

let startX, startY, endX, endY;
let isDrawing = false;
let overlay;
let rect;

function createOverlay() {
    overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.zIndex = '10000';
    overlay.style.cursor = 'crosshair';
    document.body.appendChild(overlay);

    overlay.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
}

function removeOverlay() {
    if (overlay) {
        document.body.removeChild(overlay);
        overlay = null;
    }
    if (rect) {
        document.body.removeChild(rect);
        rect = null;
    }

    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
}

function drawRect() {
    if (!rect) {
        rect = document.createElement('div');
        rect.style.position = 'fixed';
        rect.style.border = '2px solid red';
        rect.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
        rect.style.zIndex = '10001';
        document.body.appendChild(rect);
    }
    rect.style.left = `${Math.min(startX, endX)}px`;
    rect.style.top = `${Math.min(startY, endY)}px`;
    rect.style.width = `${Math.abs(endX - startX)}px`;
    rect.style.height = `${Math.abs(endY - startY)}px`;
}

function onMouseDown(e) {
    startX = e.clientX;
    startY = e.clientY;
    isDrawing = true;
    window.addEventListener('mousemove', onMouseMove);
}

function onMouseMove(e) {
    if (!isDrawing) return;
    endX = e.clientX;
    endY = e.clientY;
    requestAnimationFrame(drawRect); // Mettre à jour le rectangle à chaque frame
}


function onMouseUp(e) {
    if (!isDrawing) return;
    isDrawing = false;

    removeOverlay(); // Nettoyer l'interface utilisateur

    chrome.runtime.sendMessage({
        action: "captureArea",
        coordinates: { startX, startY, endX, endY }
    });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "cropImage") {
        cropImage(request.imageUri, request.coordinates, request.openAIKey);
    }
});

function cropImage(base64Image, coords, openAIKey) {
    const img = new Image();
    img.onload = function () {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Définir la taille du canvas à la taille de la zone de découpe
        canvas.width = Math.abs(coords.endX - coords.startX);
        canvas.height = Math.abs(coords.endY - coords.startY);

        // Dessiner l'image sur le canvas, décalée pour ne garder que la zone de découpe
        ctx.drawImage(img,
            coords.startX, coords.startY, canvas.width, canvas.height,
            0, 0, canvas.width, canvas.height);

        // Convertir la zone découpée en base64
        const croppedImage = canvas.toDataURL();

        // Vous pouvez maintenant utiliser croppedImage pour vos besoins (l'afficher, l'enregistrer, etc.)
        analyzeImageWithOpenAI(croppedImage, openAIKey);
    };
    img.src = base64Image;
}

async function analyzeImageWithOpenAI(base64Image, openAIKey) {
    const apiEndpoint = 'https://api.openai.com/v1/chat/completions';
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`
    };

    const payload = {
        model: "gpt-4-vision-preview",
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: "Describe in a few word what is in this image?"
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `${base64Image}`
                        }
                    }
                ]
            }
        ],
        max_tokens: 300
    };

    chrome.storage.local.set({ "lastImage": base64Image }, function () {
        console.log("Image saved to local storage.");
    });
    
    if (openAIKey === undefined || openAIKey == "") {
        console.error("Error the OpenAI API Key is not defined");
        showNotification("Error", "Error the OpenAI API Key is not defined");   
        return; 
    }

    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
            showNotification("Description", data.choices[0].message.content);
          } else {
            showNotification("Description", "No valid description received");
          }
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        showNotification("Error", error.message);
    }

}

function showNotification(title, message) {
    if (title != "Error") {
        chrome.storage.local.set({ "lastChatGPTResponse": message }, function() {
            console.log("ChatGPT response saved to local storage.");
        });
    } else {
        chrome.storage.local.set({ "lastChatGPTResponse": "" }, function() {
            console.log("Cleared ChatGPT response saved to local storage.");
        });
    }
    chrome.runtime.sendMessage({
        action: "showNotification",
        title: title,
        message: message
    });
};