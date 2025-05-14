/**
 * Sends an HTTP request using axios to the specified URL with the given method, headers, and body.
 *
 * @async
 * @function sendRequest
 * @param {string} URL - The endpoint path to append to the BASE_URL.
 * @param {string} [method="get"] - The HTTP method to use (e.g., "get", "post", "put", "delete").
 * @param {Object} headers - Additional headers to include in the request.
 * @param {Object|null} [body=null] - The request payload for methods like POST or PUT.
 * @returns {Promise<{status: number, data: any}>} An object containing the HTTP status code and response data.
 */
const { default: axios } = require("axios")
const { BASE_URL } = require("../config/endpoints")


const sendRequest = async (URL, method = "get", headers, body = null) => {
    const fullUrl = `${BASE_URL}${URL}`;
    try {
        console.log('Request:', { method: method.toUpperCase(), url: fullUrl });
        const response = await axios({
            url: fullUrl,
            method: method,
            headers: {
                ...headers,
                "accept": "application/json",
                "Authorization": `Basic ${process.env.KALEIDO_API_KEY}`,
            },
            data: body,
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