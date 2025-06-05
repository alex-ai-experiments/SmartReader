<p align="center">
  <img src="https://github.com/user-attachments/assets/696d2d5e-7f37-4e94-be57-64f2d9cdc05d" alt="Descriptive Alt Text" width="200" />
</p>

# Read It Later with AI Summaries

This Chrome extension allows you to save web articles for later reading and automatically generates AI-powered summaries and keywords for them. It consists of a .NET backend API, a Chrome extension for capturing articles, a PostgreSQL database for storage, Azure Blob Storage for article content, Google's Gemini API for text analysis, and a Vue.js frontend to view saved articles.

# Info

Go to [Building the Extension](#building-the-extension) for a quick run of the Chrome extension. The articles can be accessed at https://rdltarticles.z36.web.core.windows.net/. For more configuration, follow the [Local Development Setup (Docker)](#local-development-setup-docker). The frontend page acts more as a demo view for the articles saved and their summaries/keywords.

# Examples

![brave_djCCzksgcY](https://github.com/user-attachments/assets/ce60214a-8d0e-456d-bd9d-4187dd541182)
*Process of saving an article and displaying the AI summary of it (plus the keywords)*

![image](https://github.com/user-attachments/assets/36bdd4f7-fa24-4508-a785-1430aafe899a)
*The SmartReader main page with all articles*

## Table of Contents

1.  [Architecture](#architecture)
2.  [Technologies Used](#technologies-used)
3.  [Local Development Setup (Docker)](#local-development-setup-docker)
    *   [Prerequisites](#prerequisites-docker)
    *   [Running the Backend](#running-the-backend)
    *   [Accessing Services](#accessing-services)
    *   [Database Configuration](#database-configuration)
4.  [Chrome Extension Setup](#chrome-extension-setup)
    *   [Prerequisites](#prerequisites-extension)
    *   [Building the Extension](#building-the-extension)
    *   [Loading the Extension in Chrome](#loading-the-extension-in-chrome)
    *   [Configuring Extension for Local API](#configuring-extension-for-local-api)
5.  [Backend API Endpoints](#backend-api-endpoints)
6.  [Frontend Web Application](#frontend-web-application)
7.  [Configuration Notes](#configuration-notes)

## Architecture

The application is composed of several key components:

*   **Backend API (.NET 9)**:
    *   Built with ASP.NET Core Minimal APIs.
    *   Handles article creation, retrieval, and management.
    *   Integrates with Azure Blob Storage to store the full Markdown content of articles.
    *   Uses the Google Gemini API to generate summaries and keywords from article content.
    *   Connects to a PostgreSQL database via Entity Framework Core to store article metadata.
*   **Chrome Extension (TypeScript)**:
    *   Allows users to capture the content of the current web page with a single click.
    *   Uses Mozilla's Readability library to extract the main article content.
    *   Converts the extracted HTML content to Markdown.
    *   Sends the article title, URL, and Markdown content to the backend API.
    *   Displays the AI-generated summary and keywords in the extension popup after successfully saving an article.
*   **Database (PostgreSQL)**:
    *   Stores metadata for each article, including title, URL, save date, read status, reference to the blob (BlobGuid), AI-generated summary, and keywords.
*   **Azure Blob Storage**:
    *   Stores the full Markdown content of each saved article. Each article's content is stored as a separate blob.
*   **Google Gemini API**:
    *   Provides the AI capabilities for analyzing article content, generating a concise summary, and extracting relevant keywords.
*   **Frontend Web Application (Vue.js)**:
    *   This is a simple frontend focused mainly on acting as a demo view of the saved articles and everything.
    *   A single-page application (`main.html`) built with Vue.js.
    *   Hosted as a static website (currently on Azure Blob Storage static website feature).
    *   Allows users to browse their saved articles, view the full content, and see the AI-generated summaries and keywords.
*   **Docker & Nginx (for Local Development)**:
    *   Docker and Docker Compose are used to orchestrate the local development environment, including the backend API, PostgreSQL database, and pgAdmin (a PostgreSQL management tool).
    *   Nginx acts as a reverse proxy, routing requests from `localhost` to the appropriate services (API or pgAdmin) running in Docker containers.

## Technologies Used

*   **Backend**: .NET 9, C#, ASP.NET Core Minimal APIs, Entity Framework Core
*   **Database**: PostgreSQL
*   **Cloud Storage**: Azure Blob Storage (for article content and hosting `main.html`)
*   **AI Service**: Google Gemini API
*   **Chrome Extension**: TypeScript, HTML, CSS, Mozilla Readability, Webpack
*   **Frontend Web App**: Vue.js 3, Axios, HTML, CSS
*   **Containerization**: Docker
*   **Reverse Proxy**: Nginx (for local development)
*   **API Documentation**: Scalar/OpenAPI

## Local Development Setup (Docker)

This setup allows you to run the backend API, database, and pgAdmin locally using Docker.

### Prerequisites (Docker)

*   Docker Desktop installed and running on your system.

### Running the Backend

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd <repository-folder>
    ```
2.  **Ensure configuration files are present**:
    *   `docker-compose.yml`
    *   `nginx.conf`
    *   `appsettings.json` (The API, Gemini, and Blob Storage keys are sourced from here. Ensure they are valid or update them.)
3.  **Start the services using Docker Compose**:
    Open a terminal in the project root directory (where `docker-compose.yml` is located) and run:
    ```bash
    docker-compose up -d --build
    ```
    This command will build the API image (if not already built or if changes are detected) and start all defined services (API, PostgreSQL database, pgAdmin, Nginx) in detached mode.

### Accessing Services

Once the Docker containers are running, you can access the services:

*   **Backend API**:
    *   The API is accessible via the Nginx reverse proxy.
    *   Base URL: `http://localhost/api/`
    *   Example: `http://localhost/api/articles`
    *   OpenAPI/Scalar documentation: `http://localhost/api/openapi` or `http://localhost/api/scalar` (when `ASPNETCORE_ENVIRONMENT=Development`)
*   **pgAdmin (Database Management)**:
    *   URL: `http://localhost/pgadmin/`
    *   Default Login Credentials:
        *   Email: `admin@example.com`
        *   Password: `adminpassword`
    *   After logging in, you'll need to add a new server connection to connect to the `postgres_db` container:
        *   Host name/address: `postgres_db` (this is the service name in `docker-compose.yml`)
        *   Port: `5432`
        *   Maintenance database: `articledb`
        *   Username: `user`
        *   Password: `password`

### Database Configuration

*   The `docker-compose.yml` file configures the PostgreSQL container with a user, password, and database name (`articledb`, `user`, `password`).
*   The API service within `docker-compose.yml` has its `ConnectionStrings__DefaultConnection` environment variable set to connect to this Dockerized PostgreSQL instance:
    `Host=postgres_db;Port=5432;Database=articledb;Username=user;Password=password`
*   Database migrations are applied automatically on application startup as configured in `Program.cs`.

## Chrome Extension Setup

This section explains how to build and load the Chrome extension for saving articles.

### Prerequisites (Extension)

*   Node.js and npm (or yarn) installed.

### Building the Extension

1.  **Navigate to the project root directory** (where `package.json` is located).
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Build the extension**:
    ```bash
    npm run build
    ```
    This command uses Webpack to compile the TypeScript files (`popup.ts`, `content.ts`) and copy necessary assets (manifest, HTML, icons) into a `dist` folder in the project root.

### Loading the Extension in Chrome

1.  Open Google Chrome.
2.  Navigate to `chrome://extensions` in the address bar.
3.  **Enable Developer Mode**: Toggle the "Developer mode" switch in the top-right corner of the page.
4.  **Load Unpacked Extension**:
    *   Click the "Load unpacked" button that appears.
    *   In the file dialog, navigate to your project directory and select the `dist` folder (created by the `npm run build` command).
    *   Click "Select Folder".
5.  The "Save Article Extension" should now appear in your list of extensions and its icon should be visible in the Chrome toolbar.
6.  ![image](https://github.com/user-attachments/assets/37c2f2da-00b7-4c44-b7ef-109d30a3ba39)


### Configuring Extension for Local API

By default, the Chrome extension (`src/popup.ts`) is configured to send requests to the deployed API:
`const apiUrl = "https://readitlater.azurewebsites.net/article";`

**To test the extension with your local Dockerized backend API**:
1.  Open `src/popup.ts`.
2.  Change the `apiUrl` to point to your local Nginx proxy:
    ```typescript
    const apiUrl = "http://localhost/api/article"; // For local Docker setup
    ```
3.  **Rebuild the extension**:
    ```bash
    npm run build
    ```
4.  Go back to `chrome://extensions` and click the "reload" icon (circular arrow) for the "Save Article Extension".

## Backend API Endpoints

The backend API exposes the following endpoints (prefixed with `/api/` when accessed via the local Nginx proxy, e.g., `http://localhost/api/articles`):

*   **`GET /articles`**
    *   **Description**: Retrieves a list of all saved articles.
    *   **Response**: `200 OK`
        ```json
        [
          {
            "id": "c8a0b9e1-7f3a-4b9c-8e2d-0f1a2b3c4d5e",
            "title": "Example Article Title",
            "url": "http://example.com/article",
            "savedAtUtc": "2023-10-27T10:30:00Z",
            "isRead": false,
            "blobGuid": "c8a0b9e1-7f3a-4b9c-8e2d-0f1a2b3c4d5e.md",
            "textSummary": "This is a concise AI-generated summary of the article...",
            "keywords": "[\"keyword1\",\"keyword2\",\"keyword3\"]"
          }
          // ... more articles
        ]
        ```

*   **`GET /article/{id}`**
    *   **Description**: Retrieves a specific article by its ID, including its full Markdown content from blob storage.
    *   **Parameters**:
        *   `id` (GUID, path parameter): The ID of the article to retrieve.
    *   **Response**: `200 OK`
        ```json
        {
          "id": "c8a0b9e1-7f3a-4b9c-8e2d-0f1a2b3c4d5e",
          "title": "Example Article Title",
          "url": "http://example.com/article",
          "savedAtUtc": "2023-10-27T10:30:00Z",
          "isRead": false,
          "textSummary": "This is a concise AI-generated summary...",
          "keywords": "[\"keyword1\",\"keyword2\"]",
          "content": "# Article Title\n\nThis is the full Markdown content of the article..."
        }
        ```
    *   **Responses**:
        *   `404 Not Found`: If the article with the specified ID is not found.
        *   `500 Internal Server Error`: If there's an error retrieving content from blob storage.

*   **`POST /article`**
    *   **Description**: Creates a new article. The service will:
        1.  Generate a unique ID for the article.
        2.  Upload the provided `content` (in Markdown format) to Azure Blob Storage.
        3.  Send the `content` to the Google Gemini API for summarization and keyword extraction.
        4.  Save the article's metadata (title, URL, blob reference, summary, keywords) to the PostgreSQL database.
    *   **Request Body**: `application/json`
        ```json
        {
          "title": "New Amazing Article",
          "url": "http://new-article.com/page",
          "content": "## Introduction\n\nThis is the Markdown content captured from the web page..."
        }
        ```
    *   **Response**: `201 Created` (with a `Location` header pointing to the new resource, e.g., `/articles/{new_article_id}`)
        ```json
        {
          "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
          "title": "New Amazing Article",
          "url": "http://new-article.com/page",
          "savedAtUtc": "2023-10-27T11:00:00Z",
          "isRead": false,
          "blobGuid": "a1b2c3d4-e5f6-7890-1234-567890abcdef.md",
          "textSummary": "AI summary of the new article...",
          "keywords": "[\"new\",\"amazing\",\"article\"]"
        }
        ```
    *   **Responses**:
        *   `500 Internal Server Error`: If there's an error during blob upload, AI analysis, or database saving.

## Frontend Web Application

A simple Vue.js frontend (`main.html`) is provided to view your saved articles.
*   **Deployed URL**: `https://rdltarticles.z36.web.core.windows.net/`
*   This application fetches data from the *deployed* backend API (`https://readitlater.azurewebsites.net/`).
*   It lists all saved articles. Clicking on an article displays its AI-generated summary, keywords, and the full Markdown content (rendered as HTML).

If you wish to run `main.html` locally and have it connect to your local Dockerized backend, you would need to:
1.  Open `main.html`.
2.  Modify the `ApiService.baseURL` to `http://localhost/api/`.
3.  Open `main.html` directly in your browser (or serve it via a simple HTTP server).

## Configuration Notes

*   **`appsettings.json`**: This file in the .NET project root contains crucial configuration:
    *   `ConnectionStrings:DefaultConnection`: For the database. This is overridden by `docker-compose.yml` for local Docker development.
    *   `BlobStorage:ConnectionString` and `BlobStorage:ContainerName`: Credentials for Azure Blob Storage.
    *   `Gemini:ApiKey`: Your API key for the Google Gemini service.
    **Important**: Ensure these keys (Blob Storage, Gemini) are valid and have the necessary permissions. For production, these secrets should be managed securely (e.g., Azure Key Vault, Docker secrets, environment variables in a CI/CD pipeline).
*   **Chrome Extension API URL**: As mentioned in the [Chrome Extension Setup](#configuring-extension-for-local-api), the `apiUrl` in `src/popup.ts` needs to be adjusted depending on whether you are targeting the local Dockerized API or a deployed API.
*   **CORS**: The .NET API (`Program.cs`) is configured with a CORS policy named "Development" allowing any origin, method, and header when the environment is `Development`. This is suitable for local testing. For production, configure a more restrictive CORS policy.
