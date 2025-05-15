/**
 * Sends an HTTP request using axios to the specified endpoint.
 *
 * Logs the request method and URL as:
 *   Request: { method, url, params }
 * and logs the response code and body as:
 *   Response: { code, body }
 *
 * @async
 * @function sendRequest
 * @param {string} URL - The endpoint path to append to the BASE_URL.
 * @param {string} [method="get"] - The HTTP method to use (e.g., "get", "post", "put", "delete").
 * @param {Object|null} [params=null] - Query parameters to include in the request (for GET or similar methods).
 * @returns {Promise<{status: number, data: any}>} An object containing the HTTP status code and response data.
 */
const { default: axios } = require("axios")
const { BASE_URL } = require("../config/endpoints")


const sendRequest = async (URL, method = "get", params = null) => {
    const fullUrl = `${BASE_URL}${URL}`;
    try {
        console.log('Request:', { method: method.toUpperCase(), url: fullUrl, params: params });
        const response = await axios({
            url: fullUrl,
            method: method,
            headers: {
                "accept": "application/json",
                "Authorization": `Basic ${process.env.KALEIDO_API_KEY}`,
            },
            params: params,
        });
        console.log('Response:', { code: response.status, body: response.data });
        return {
            status: response.status,
            data: response.data,
        };
    } catch (error) {
        const status = error.response ? error.response.status : 500;
        const data = error.response ? error.response.data : { message: error.message };
        console.log('Response:', { code: status, body: data });
        return {
            status,
            data,
        };
    }
}

module.exports = {
    sendRequest
};