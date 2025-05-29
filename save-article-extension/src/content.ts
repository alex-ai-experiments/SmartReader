// save-article-extension/src/content.ts
import { Readability } from '@mozilla/readability';

console.log("[CS] Content script loaded and ready for messages.");

interface ArticleData {
  title: string;
  content: string;
  url: string;
  error?: string;
}

function extractArticle(): ArticleData {
  console.log("[CS] extractArticle function called.");
  
  // Check if Readability is available
  if (typeof Readability === 'undefined') {
    console.error("[CS] Readability library is undefined! Check bundling.");
    return {
      title: document.title || "Error",
      content: "Readability library not loaded.",
      url: document.location.href,
      error: "Readability library not loaded in content script."
    };
  }

  try {
    // Check document readiness
    console.log("[CS] Document readyState:", document.readyState);
    if (document.readyState !== 'complete' && document.readyState !== 'interactive') {
      console.warn("[CS] Document may not be fully loaded yet for Readability.");
    }

    const documentClone = document.cloneNode(true) as Document;
    console.log("[CS] Document cloned for Readability.");
    const reader = new Readability(documentClone);
    const article = reader.parse();
    console.log("[CS] Readability.parse() result:", article);

    if (article && article.content) {
      console.log("[CS] Article content extracted successfully by Readability.");
      return {
        title: article.title || document.title,
        content: article.content,
        url: document.location.href,
      };
    } else {
      console.warn("[CS] Readability did not return content. Falling back to document.body.innerHTML. Article object:", article);
      return {
        title: document.title || "Fallback Title",
        content: document.body.innerHTML, // Fallback
        url: document.location.href,
        error: "Readability could not parse the article effectively. Full body used as fallback."
      };
    }
  } catch (e: any) {
    console.error("[CS] Error during Readability parsing:", e);
    let errorMessage = "Unknown error during Readability parsing.";
    if (e instanceof Error) {
      errorMessage = e.message;
    } else if (typeof e === 'string') {
      errorMessage = e;
    }
    return {
      title: document.title || "Error Title",
      content: "Error during content extraction: " + errorMessage,
      url: document.location.href,
      error: `Error during Readability parsing: ${errorMessage}`
    };
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[CS] Received message:", request);
  
  if (request.action === "extractArticle") {
    console.log("[CS] Processing extractArticle request...");
    
    try {
      const articleData = extractArticle();
      console.log("[CS] Sending response back to popup:", articleData);
      sendResponse({ success: true, data: articleData });
    } catch (error: any) {
      console.error("[CS] Error in message handler:", error);
      const errorData: ArticleData = {
        title: document.title || "Error Title",
        content: "Error in message handler: " + (error.message || error),
        url: document.location.href,
        error: `Message handler error: ${error.message || error}`
      };
      sendResponse({ success: false, data: errorData });
    }
  } else {
    console.log("[CS] Unknown action:", request.action);
    sendResponse({ success: false, error: "Unknown action" });
  }
  
  // Return true to indicate we will send a response asynchronously
  return true;
});