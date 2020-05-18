/**
 * @file Add JavaScript's functionality
 *
 * @author Lucas Bernardo
 *
 * @requires NPM:request
 */

const { promisify } = require('util');
const request = require('request');

/**
 * Waits a determined time to fulfill a Promise
 *
 * @param {number} ms - The milliseconds to fulfill the Promise
 *
 * @returns {Promise<any>} Represents the fulfilled time
 */
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Try to POST the request to the following URL using the maximumRetry option
 *
 * @param {object} options - The options to pass to request
 * @param {number} [attempt=0] - The current attempt number
 * @param {number} [delay=0] - The time in milliseconds to wait before request
 * @param {number} [maximumRetry=0] - The maximum retry before fail
 *
 * @returns {Promise<*|void>} Represents the fulfilled request
 *
 * @private
 */
const retry = async (options, attempt = 0, delay = 0, maximumRetry = 0) => {
  try {
    await sleep(delay);
    const { statusCode, body } = await promisify(request)(options);
    return { statusCode, body };
  } catch (e) {
    if (attempt >= maximumRetry) throw Error(e);
    return retry(options, attempt + 1, (delay || 1000) * 2);
  }
};

module.exports = {
  retry,
};
