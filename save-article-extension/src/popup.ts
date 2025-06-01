// save-article-extension/src/popup.ts

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

document.addEventListener("DOMContentLoaded", () => {
  const saveButton = document.getElementById(
    "saveArticleBtn"
  ) as HTMLButtonElement;
  const statusDiv = document.getElementById("status") as HTMLDivElement;

  if (saveButton) {
    saveButton.addEventListener("click", async () => {
      setStatus("Extracting content...", "info");
      saveButton.disabled = true;

      try {
        const [currentTab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (currentTab && currentTab.id) {
          console.log("[Popup] Sending message to tab:", currentTab.id);
          
          // Send message to content script
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
        
        // Check if it's a content script not found error
        if (error.message && error.message.includes("Could not establish connection")) {
          setStatus(
            "Error: Content script not loaded. Please refresh the page and try again.",
            "error"
          );
        } else {
          setStatus(`Error: ${error.message || "Unknown error"}`, "error");
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
      content: article.content, // This is HTML content
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
        setStatus("Article saved successfully!", "success");
        console.log("Article saved:", await response.json());
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

  function setStatus(
    message: string,
    type: "info" | "success" | "error" | "warning"
  ) {
    if (statusDiv) {
      statusDiv.textContent = message;
      statusDiv.className = type; // You can style these classes
      if (type === "error") statusDiv.style.color = "red";
      else if (type === "success") statusDiv.style.color = "green";
      else if (type === "warning") statusDiv.style.color = "orange";
      else statusDiv.style.color = "black";
    }
  }
});