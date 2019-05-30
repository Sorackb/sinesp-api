
/**
 * @file Add JavaScript's functionality
 *
 * @author Lucas Bernardo
 *
 * @requires NPM:request
 */

const { promisify } = require('util');
const { post } = require('request');

const promisedPost = promisify(post);

/**
 * Waits a determined time to fulfill a Promise
 *
 * @param {number} ms - The milliseconds to fulfill the Promise
 *
 * @returns {Promise<any>} Represents the fulfilled time
 */
const sleep = ms => new Promise(res => setTimeout(res, ms));

/**
 * Try to POST the request to the following URL using the maximumRetry option
 *
 * @param {object} options - The options to pass to request
 * @param {number} [attempt=0] - The current attempt number
 * @param {number} [delay=0] - The time in milliseconds to wait before request
 *
 * @returns {Promise<*|void>} Represents the fulfilled request
 *
 * @private
 */
const retry = async (options, attempt = 0, delay = 0) => {
  await sleep(delay);
  const { body } = await promisedPost(options);
  return body;
};

module.exports = {
  retry,
};
