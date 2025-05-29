// save-article-extension/src/content.ts
import { Readability } from '@mozilla/readability';

console.log("[CS] Content script loaded and ready for messages.");

interface ArticleData {
  title: string;
  content: string;
  url: string;
  error?: string;
}

/**
 * Converts HTML content to markdown format with text-only content
 * @param htmlContent - The HTML content to convert
 * @returns Markdown formatted string with only text content
 */
function htmlToMarkdown(htmlContent: string): string {
  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  // Remove script, style, and other non-content elements
  const elementsToRemove = tempDiv.querySelectorAll('script, style, nav, footer, aside, .advertisement, .ads');
  elementsToRemove.forEach(el => el.remove());

  let markdown = '';

  function processNode(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        markdown += text + ' ';
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      switch (tagName) {
        case 'h1':
          markdown += '\n\n# ';
          processChildren(node);
          markdown += '\n\n';
          break;
        case 'h2':
          markdown += '\n\n## ';
          processChildren(node);
          markdown += '\n\n';
          break;
        case 'h3':
          markdown += '\n\n### ';
          processChildren(node);
          markdown += '\n\n';
          break;
        case 'h4':
          markdown += '\n\n#### ';
          processChildren(node);
          markdown += '\n\n';
          break;
        case 'h5':
          markdown += '\n\n##### ';
          processChildren(node);
          markdown += '\n\n';
          break;
        case 'h6':
          markdown += '\n\n###### ';
          processChildren(node);
          markdown += '\n\n';
          break;
        case 'p':
          markdown += '\n\n';
          processChildren(node);
          markdown += '\n\n';
          break;
        case 'br':
          markdown += '\n';
          break;
        case 'strong':
        case 'b':
          markdown += '**';
          processChildren(node);
          markdown += '**';
          break;
        case 'em':
        case 'i':
          markdown += '*';
          processChildren(node);
          markdown += '*';
          break;
        case 'code':
          markdown += '`';
          processChildren(node);
          markdown += '`';
          break;
        case 'pre':
          markdown += '\n\n```\n';
          processChildren(node);
          markdown += '\n```\n\n';
          break;
        case 'blockquote':
          markdown += '\n\n> ';
          processChildren(node);
          markdown += '\n\n';
          break;
        case 'ul':
        case 'ol':
          markdown += '\n\n';
          processChildren(node);
          markdown += '\n\n';
          break;
        case 'li':
          markdown += '\n- ';
          processChildren(node);
          break;
        case 'a':
          const href = element.getAttribute('href');
          if (href) {
            markdown += '[';
            processChildren(node);
            markdown += `](${href})`;
          } else {
            processChildren(node);
          }
          break;
        case 'img':
          const src = element.getAttribute('src');
          const alt = element.getAttribute('alt') || 'Image';
          if (src) {
            markdown += `\n\n![${alt}](${src})\n\n`;
          }
          break;
        case 'hr':
          markdown += '\n\n---\n\n';
          break;
        default:
          // For other elements, just process their children
          processChildren(node);
          break;
      }
    }
  }

  function processChildren(node: Node): void {
    for (const child of Array.from(node.childNodes)) {
      processNode(child);
    }
  }

  processChildren(tempDiv);

  // Clean up the markdown - remove excessive whitespace and newlines
  return markdown
    .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with 2
    .replace(/[ \t]+/g, ' ')    // Replace multiple spaces/tabs with single space
    .replace(/[ \t]*\n[ \t]*/g, '\n') // Remove spaces around newlines
    .trim();
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
      
      // Convert HTML content to Markdown
      const markdownContent = htmlToMarkdown(article.content);
      console.log("[CS] Content converted to Markdown format.");
      
      return {
        title: article.title || document.title,
        content: markdownContent, // Now returns markdown instead of HTML
        url: document.location.href,
      };
    } else {
      console.warn("[CS] Readability did not return content. Falling back to document.body.innerHTML. Article object:", article);
      
      // Convert fallback HTML content to Markdown as well
      const fallbackMarkdown = htmlToMarkdown(document.body.innerHTML);
      
      return {
        title: document.title || "Fallback Title",
        content: fallbackMarkdown, // Fallback also converted to markdown
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