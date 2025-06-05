/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/popup.ts":
/*!**********************!*\
  !*** ./src/popup.ts ***!
  \**********************/
/***/ (function() {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
document.addEventListener("DOMContentLoaded", () => {
    const saveButton = document.getElementById("saveArticleBtn");
    const statusDiv = document.getElementById("status");
    const summaryContainer = document.getElementById("summaryContainer");
    const summaryTextElement = document.getElementById("summaryText");
    const keywordsListElement = document.getElementById("keywordsList");
    function clearAiSummary() {
        if (summaryContainer) {
            summaryContainer.style.display = "none";
        }
        if (summaryTextElement) {
            summaryTextElement.textContent = "";
        }
        if (keywordsListElement) {
            keywordsListElement.innerHTML = "";
        }
    }
    if (saveButton) {
        saveButton.addEventListener("click", () => __awaiter(void 0, void 0, void 0, function* () {
            clearAiSummary();
            setStatus("Extracting content...", "info");
            saveButton.disabled = true;
            try {
                const [currentTab] = yield chrome.tabs.query({
                    active: true,
                    currentWindow: true,
                });
                if (currentTab && currentTab.id) {
                    console.log("[Popup] Sending message to tab:", currentTab.id);
                    const response = yield new Promise((resolve, reject) => {
                        chrome.tabs.sendMessage(currentTab.id, { action: "extractArticle" }, (response) => {
                            if (chrome.runtime.lastError) {
                                console.error("[Popup] Runtime error:", chrome.runtime.lastError.message);
                                reject(new Error(chrome.runtime.lastError.message));
                            }
                            else {
                                console.log("[Popup] Received response:", response);
                                resolve(response);
                            }
                        });
                    });
                    if (response.success && response.data) {
                        const articleData = response.data;
                        console.log("[Popup] Successfully received articleData:", articleData);
                        if (articleData.error) {
                            console.warn("[Popup] Extraction warning:", articleData.error);
                            setStatus(`Warning: ${articleData.error}. Trying to save...`, "warning");
                        }
                        else {
                            setStatus("Content extracted. Saving...", "info");
                        }
                        yield sendArticleToServer(articleData);
                    }
                    else {
                        const errorMsg = response.error || "Failed to extract content";
                        console.error("[Popup] Content script error:", errorMsg);
                        setStatus(`Error: ${errorMsg}`, "error");
                    }
                }
                else {
                    setStatus("Error: Could not get active tab.", "error");
                }
            }
            catch (error) {
                console.error("[Popup] Error processing article:", error);
                let errorMessage = "Unknown error occurred.";
                if (error && error.message) {
                    errorMessage = error.message;
                }
                if (errorMessage.includes("Could not establish connection")) {
                    setStatus("Error: Content script not loaded. Please refresh the page and try again.", "error");
                }
                else {
                    setStatus(`Error: ${errorMessage}`, "error");
                }
            }
            finally {
                saveButton.disabled = false;
            }
        }));
    }
    function sendArticleToServer(article) {
        return __awaiter(this, void 0, void 0, function* () {
            const apiUrl = "https://readitlater.azurewebsites.net/article";
            const payload = {
                title: article.title,
                url: article.url,
                content: article.content,
            };
            try {
                const response = yield fetch(apiUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });
                if (response.ok) {
                    const savedArticle = yield response.json();
                    console.log("Article saved:", savedArticle);
                    setStatus("Article saved successfully!", "success");
                    if (savedArticle.textSummary) {
                        displayAiSummary(savedArticle.textSummary, savedArticle.keywords);
                        setStatus("Article saved and AI summary retrieved!", "success");
                    }
                    else {
                        setStatus("Article saved. AI summary not available at this time.", "warning");
                    }
                }
                else {
                    const errorText = yield response.text();
                    console.error("Error saving article:", response.status, errorText);
                    setStatus(`Error ${response.status}: ${errorText || "Failed to save article."}`, "error");
                }
            }
            catch (error) {
                console.error("Network error or server down:", error);
                setStatus(`Network error: ${error.message}. Is the server running at ${apiUrl}?`, "error");
            }
        });
    }
    function displayAiSummary(summary, keywordsJsonString) {
        if (!summaryContainer || !summaryTextElement || !keywordsListElement) {
            console.error("Summary display elements not found in the DOM.");
            return;
        }
        summaryTextElement.textContent = summary;
        keywordsListElement.innerHTML = "";
        let parsedKeywords = null;
        if (keywordsJsonString) {
            try {
                parsedKeywords = JSON.parse(keywordsJsonString);
            }
            catch (e) {
                console.error("Error parsing keywords JSON:", e, "Input:", keywordsJsonString);
                const li = document.createElement("li");
                li.textContent = "Error: Could not parse keywords.";
                li.style.fontStyle = "italic";
                keywordsListElement.appendChild(li);
                summaryContainer.style.display = "block";
                return;
            }
        }
        if (Array.isArray(parsedKeywords) && parsedKeywords.length > 0) {
            parsedKeywords.forEach(keyword => {
                const li = document.createElement("li");
                li.textContent = keyword;
                keywordsListElement.appendChild(li);
            });
        }
        else {
            const li = document.createElement("li");
            li.textContent = "No keywords available.";
            keywordsListElement.appendChild(li);
        }
        summaryContainer.style.display = "block";
    }
    function setStatus(message, type) {
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.className = type;
        }
    }
});


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/popup.ts"]();
/******/ 	
/******/ })()
;
//# sourceMappingURL=popup.js.map