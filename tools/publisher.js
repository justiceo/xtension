import fetch from "node-fetch";
import fs from "fs";

/** 
 * Creates and updates Chrome Web Store items.
 * Setup instructions: https://developer.chrome.com/docs/webstore/using-api
 */
export class StorePublisher {
  constructor(authToken) {
    this.authToken = authToken;
    this.apiVersion = "2";
    this.baseUrl = "https://www.googleapis.com/chromewebstore/v1.1";
  }

  /**
   * Retrieves the client credentials from the environment variables.
   */
  getClientCredentials() {
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        "Client ID or Client Secret is not set in environment variables.",
      );
    }

    return { clientId, clientSecret };
  }

  defaultHeaders() {
    return {
      Authorization: `Bearer ${this.authToken}`,
      "x-goog-api-version": this.apiVersion,
    };
  }

  // https://developer.chrome.com/docs/webstore/using-api#refresh_your_access_token
  async refreshAccessToken(clientId, clientSecret, refreshToken) {
    const url = "https://oauth2.googleapis.com/token";
    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);
    params.append("refresh_token", refreshToken);
    params.append("grant_type", "refresh_token");

    this.makeRequest(url, "POST", params, {
      "Content-Type": "application/x-www-form-urlencoded",
    });
  }

  async makeRequest(url, method, body = null, headers = {}) {
    try {
      const response = await fetch(url, {
        method: method,
        headers: headers,
        body: body,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`Error during ${method} request to ${url}:`, error);
      throw error;
    }
  }

  /**
   * Uploads an item that creates a new listing on the chrome webstore.
   * Ref - https://developer.chrome.com/docs/webstore/using-api#uploadnew
   *
   * @param {string} filePath - Path to the ZIP file of the Chrome extension.
   * @returns {Promise<Object>} - The JSON response from the API.
   */
  async createItem(filePath) {
    const fileBuffer = await fs.readFile(filePath);
    return this.makeRequest(`${this.baseUrl}/items`, "POST", fileBuffer, {
      "Content-Type": "application/octet-stream",
    });
  }

  async updateItem(filePath, extensionId) {
    const fileBuffer = await fs.readFile(filePath);
    return this.makeRequest(
      `${this.baseUrl}/items/${extensionId}`,
      "PUT",
      fileBuffer,
      {
        ...this.defaultHeaders(),
        "Content-Type": "application/octet-stream",
      },
    );
  }

  async publishItemPublic(extensionId) {
    return this.makeRequest(
      `${this.baseUrl}/items/${extensionId}/publish`,
      "POST",
      null,
      {
        ...this.defaultHeaders(),
        "Content-Length": "0",
      },
    );
  }

  async publishItemTrustedTesters(extensionId) {
    return this.makeRequest(
      `${this.baseUrl}/items/${extensionId}/publish?publishTarget=trustedTesters`,
      "POST",
      null,
      {
        ...this.defaultHeaders(),
        "Content-Length": "0",
      },
    );
  }

  async checkItemStatus(extensionId) {
    return this.makeRequest(
      `${this.baseUrl}/items/${extensionId}?projection=DRAFT`,
      "GET",
      null,
      {
        ...this.defaultHeaders(),
        "Content-Length": "0",
        Expect: "",
      },
    );
  }
}
