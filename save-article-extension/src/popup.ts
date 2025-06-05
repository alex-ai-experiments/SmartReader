interface ArticleData {
  title: string;
  content: string;
  url: string;
  error?: string;
}

interface MessageResponse {
  success: boolean;
  data?: ArticleData;
  error?: string;
}

interface SavedArticleResponse {
  id: string;
  title: string;
  url: string;
  savedAtUtc: string;
  isRead: boolean;
  blobGuid: string;
  textSummary?: string; 
  keywords?: string;  
}

document.addEventListener("DOMContentLoaded", () => {
  const saveButton = document.getElementById(
    "saveArticleBtn"
  ) as HTMLButtonElement;
  const statusDiv = document.getElementById("status") as HTMLDivElement;

  const summaryContainer = document.getElementById("summaryContainer") as HTMLDivElement;
  const summaryTextElement = document.getElementById("summaryText") as HTMLParagraphElement;
  const keywordsListElement = document.getElementById("keywordsList") as HTMLUListElement;

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
    saveButton.addEventListener("click", async () => {
      clearAiSummary();
      setStatus("Extracting content...", "info");
      saveButton.disabled = true;

      try {
        const [currentTab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (currentTab && currentTab.id) {
          console.log("[Popup] Sending message to tab:", currentTab.id);
          
          const response = await new Promise<MessageResponse>((resolve, reject) => {
            chrome.tabs.sendMessage(
              currentTab.id!,
              { action: "extractArticle" },
              (response: MessageResponse) => {
                if (chrome.runtime.lastError) {
                  console.error("[Popup] Runtime error:", chrome.runtime.lastError.message);
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  console.log("[Popup] Received response:", response);
                  resolve(response);
                }
              }
            );
          });

          if (response.success && response.data) {
            const articleData = response.data;
            console.log("[Popup] Successfully received articleData:", articleData);

            if (articleData.error) {
              console.warn("[Popup] Extraction warning:", articleData.error);
              setStatus(
                `Warning: ${articleData.error}. Trying to save...`,
                "warning"
              );
            } else {
              setStatus("Content extracted. Saving...", "info");
            }
            
            await sendArticleToServer(articleData);
          } else {
            const errorMsg = response.error || "Failed to extract content";
            console.error("[Popup] Content script error:", errorMsg);
            setStatus(`Error: ${errorMsg}`, "error");
          }
        } else {
          setStatus("Error: Could not get active tab.", "error");
        }
      } catch (error: any) {
        console.error("[Popup] Error processing article:", error);
        
        let errorMessage = "Unknown error occurred.";
        if (error && error.message) {
            errorMessage = error.message;
        }

        if (errorMessage.includes("Could not establish connection")) {
          setStatus(
            "Error: Content script not loaded. Please refresh the page and try again.",
            "error"
          );
        } else {
          setStatus(`Error: ${errorMessage}`, "error");
        }
      } finally {
        saveButton.disabled = false;
      }
    });
  }

  async function sendArticleToServer(article: ArticleData) {
    const apiUrl = "https://readitlater.azurewebsites.net/article";
    const payload = {
      title: article.title,
      url: article.url,
      content: article.content, 
    };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const savedArticle: SavedArticleResponse = await response.json();
        console.log("Article saved:", savedArticle);
        setStatus("Article saved successfully!", "success"); 

        if (savedArticle.textSummary) {
          displayAiSummary(savedArticle.textSummary, savedArticle.keywords);
          setStatus("Article saved and AI summary retrieved!", "success");
        } else {
          setStatus("Article saved. AI summary not available at this time.", "warning");
        }
      } else {
        const errorText = await response.text();
        console.error("Error saving article:", response.status, errorText);
        setStatus(
          `Error ${response.status}: ${errorText || "Failed to save article."}`,
          "error"
        );
      }
    } catch (error: any) {
      console.error("Network error or server down:", error);
      setStatus(
        `Network error: ${error.message}. Is the server running at ${apiUrl}?`,
        "error"
      );
    }
  }

  function displayAiSummary(summary: string, keywordsJsonString?: string | null) {
    if (!summaryContainer || !summaryTextElement || !keywordsListElement) {
      console.error("Summary display elements not found in the DOM.");
      return;
    }

    summaryTextElement.textContent = summary;
    keywordsListElement.innerHTML = ""; 

    let parsedKeywords: string[] | null = null;

    if (keywordsJsonString) { 
      try {
        parsedKeywords = JSON.parse(keywordsJsonString); 
      } catch (e) {
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
    } else {
      const li = document.createElement("li");
      li.textContent = "No keywords available.";
      keywordsListElement.appendChild(li);
    }
    summaryContainer.style.display = "block";
  }

  function setStatus(
    message: string,
    type: "info" | "success" | "error" | "warning"
  ) {
    if (statusDiv) {
      statusDiv.textContent = message;
      statusDiv.className = type;
    }
  }
});