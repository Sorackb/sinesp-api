/**
 * @file Manages the wrapper of SINESP's search for plates
 *
 * @author Lucas Bernardo
 */

const { retry } = require('./tools');

/**
 * The accepted format: AAA0000, AAA0AA0, AAA00A0
 *
 * @constant
 *
 * @type {RegExp}
 */
const PLATE_FORMATS = [
  /^[a-zA-Z]{3}[0-9]{4}$/im,
  /^[a-zA-Z]{3}[0-9]{1}[a-zA-Z]{1}[0-9]{2}$/im,
  /^[a-zA-Z]{3}[0-9]{2}[a-zA-Z]{1}[0-9]{1}$/im,
];
const SPECIAL = /[^a-zA-Z0-9]/i;

const DEFAULT = {
  host: 'apicarros.com',
  endpoint: 'consulta',
  serviceVersion: 'v1',
  timeout: 0,
  maximumRetry: 0,
  proxy: {},
};

let opts = {};

/**
 * Validate the format of the plate informed
 *
 * @param {string} plate - The informed plate
 *
 * @returns {Promise<string>} Represents the plate without special characters
 *
 * @private
 */
const validate = async (plate) => {
  const plateToUse = plate.replace(SPECIAL, '');

  const valid = PLATE_FORMATS.reduce((res, format) => res || format.test(plateToUse), false);

  if (!valid) {
    throw new Error('Formato de placa inválido! Utilize o formato "LLLNLNN", "LLLNNLN" ou "LLLNNNN" (em que L é letra e N, número).');
  }

  return plateToUse;
};

/**
 * Send the request to SINESP's 'search by plate' service
 *
 * @param {string} plate - The plate of the vehicle to be searched
 *
 * @returns {Promise<object>} Represents the JSON filled with the SINESP's service response
 *
 * @private
 */
const request = async (plate) => {
  const url = `https://${opts.host}/${opts.serviceVersion}/${opts.endpoint}/${plate}/json`;

  const proxy = opts.proxy.host ? `http://${opts.proxy.host}:${opts.proxy.port}` : null;

  const options = {
    url,
    proxy,
    method: 'GET',
    timeout: opts.timeout,
    strictSSL: false,
    rejectUnauthorized: false,
  };

  const { statusCode, body } = await retry(options, 0, 0, opts.maximumRetry);

  const data = JSON.parse(body);

  if (statusCode === 200 && data.codigoRetorno === '0') return data;

  throw new Error(data.mensagemRetorno);
};

/**
 * Searches a Vehicle by plate
 *
 * @example
 * // 'vehicle' is set to the response object
 * let vehicle = await search('AAA111');
 *
 * @param {string} plate - The plate of the vehicle to be searched
 *
 * @returns {Promise<object>} Represents the vehicle identified by the plate
 */
const search = async (plate = '') => {
  const plateToUse = await validate(plate);

  return request(plateToUse);
};

/**
 * Configure the module
 *
 * @param {string} [host=apicarros.com] - Host of SINESP service
 * @param {string} [serviceVersion=v1] - Service version of SINESP
 * @param {string} [endpoint=consulta] - Endpoint of SINESP service
 * @param {number} [timeout=0] - req/res timeout in ms, it resets on redirect.
 *                               0 to disable (OS limit applies)
 * @param {number} [maximumRetry=0] - Maximum retrys if the request fail
 * @param {object} [proxy={}] - The proxy object if exists
 *
 * @returns The module it self
 */
const configure = ({
  host,
  endpoint,
  serviceVersion,
  timeout,
  maximumRetry,
  proxy = {},
} = {}) => {
  opts = {
    host: host || DEFAULT.host,
    endpoint: endpoint || DEFAULT.endpoint,
    serviceVersion: serviceVersion || DEFAULT.serviceVersion,
    timeout: timeout || DEFAULT.timeout,
    maximumRetry: maximumRetry || DEFAULT.maximumRetry,
    proxy: {
      host: proxy.host || DEFAULT.proxy.host,
      port: proxy.port || DEFAULT.proxy.port,
    },
  };

  return {
    configure,
    search,
  };
};

configure();

module.exports = {
  configure,
  search,
};
