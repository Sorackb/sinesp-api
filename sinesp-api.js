/**
 * @file Manages the wrapper of SINESP's search for plates
 *
 * @author Lucas Bernardo
 *
 * @requires NPM:moment
 * @requires NPM:axios
 * @requires NPM:xml2js
 */

const {readFileSync} = require('fs');
const {join}         = require('path');
const {createHmac}   = require('crypto');
const {promisify}    = require('util');

const {parseString} = require('xml2js');
const moment        = require('moment');
const axios         = require('axios');

const _parseString = promisify(parseString);

const HOST            = 'cidadao.sinesp.gov.br';
const SERVICE_VERSION = 'v4';
const URL             = `https://${HOST}/sinesp-cidadao/mobile/consultar-placa/${SERVICE_VERSION}`;

const ANDROID_VERSION = '8.1.0';
const SECRET          = `#${ANDROID_VERSION}#g8LzUadkEHs7mbRqbX5l`;

/**
 * The accepted format: AAA0000
 *
 * @constant
 *
 * @type {RegExp}
 */
const PLATE_FORMAT = /^[a-zA-Z]{3}[0-9]{4}$/im;
const SPECIAL      = /[^a-zA-Z0-9]/i;

const XML     = readFileSync(join(__dirname, 'body.xml')).toString();
const HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'User-Agent': 'SinespCidadao / 3.0.2.1 CFNetwork / 758.2.8 Darwin / 15.0.0',
  'Host': HOST
};

module.exports = {search};

/**
 * Searches a Vehicle by plate
 *
 * @example
 * // 'vehicle' is set to the response object
 * let vehicle = await search('AAA111');
 *
 * @param {string} plate - The plate of the vehicle to be searched
 *
 * @returns {Promise<*>} Represents the vehicle identified by the plate
 */
async function search(plate) {
  let body = await _generateBody(plate || '');

  return _request(body);
}

/**
 * Validate the format of the plate informed
 *
 * @param {string} plate - The informed plate
 *
 * @returns {Promise<*>} Represents the plate without special characters
 * @private
 */
async function _validate(plate) {
  plate = plate.replace(SPECIAL, '');

  if (!PLATE_FORMAT.test(plate)) {
    throw new Error('Formato de placa inválido! Utilize o formato "AAA9999" ou "AAA-9999".');
  }

  return plate;
}

/**
 * Generates the XML body in the format expected by the SINESP's service
 *
 * @param {string} plate - Treated and informed plate
 *
 * @returns {Promise<string>} Represents the filled XML to be sent
 * @private
 */
async function _generateBody(plate) {
  let now                          = new Date();
  let result                       = XML;
  let valid                        = await _validate(plate);
  let [latitude, longitude, token] = await Promise.all([
    _generateLatitude(),
    _generateLongitude(),
    _generateToken(valid)
  ]);

  result = result.replace('{ANDROID_VERSION', ANDROID_VERSION);
  result = result.replace('{LATITUDE}', latitude);
  result = result.replace('{LONGITUDE}', longitude);
  result = result.replace('{DATE}', moment(now).format('YYYY-MM-DD HH:mm:ss'));
  result = result.replace('{TOKEN}', token);
  result = result.replace('{PLATE}', valid);

  return result;
}

/**
 * Send the request to SINESP's 'search by plate' service
 *
 * @param {string} body - The XML expected by SINESP's service
 *
 * @returns {Promise<*>} Represents the JSON filled with the SINESP's service response
 *
 * @private
 */
async function _request(body) {
  let {data} = await axios({
    method: 'POST',
    url: URL,
    data: body,
    encoding: 'binary',
    headers: HEADERS
  });

  return await _normalize(data);
}

/**
 * Transforms the answered XML in a JSON
 *
 * @param {string} returnedXML - The answered XML
 *
 * @returns {Promise<void>} Represents the JSON filled with the XML response
 *
 * @private
 */
async function _normalize(returnedXML) {
  const {'soap:Envelope': {'soap:Body': {'ns2:getStatusResponse': {return: envelope}}}} = await _parseString(returnedXML, {explicitArray: false});

  let result = {};

  for (let key in envelope) {
    if (envelope.hasOwnProperty(key)) result[key] = envelope[key];
  }

  if (Number(envelope.codigoRetorno) !== 0) {
    throw Error(envelope.mensagemRetorno);
  }

  return result;
}

/**
 * Create the token using 'SHA-1' algoritm based on the plate and the secret
 *
 * @param {string} plate - The plate to be searched
 *
 * @returns {Promise<*>} Represents the created token
 *
 * @private
 */
async function _generateToken(plate) {
  let created = createHmac('sha1', `${plate}${SECRET}`);

  created.update(plate);

  return created.digest('hex');
}

/**
 * Generates the coordinates used in the request
 *
 * @returns {Promise<number>} Represents a random coordinate
 *
 * @private
 */
async function _generateCoordinate() {
  let seed;

  seed = 2000 / Math.sqrt(Math.random());
  seed = seed * Math.sin(2 * 3.141592654 * Math.random());

  return seed;
}

/**
 * Generates a random latitude
 *
 * @returns {Promise<number>} Represents a random latitude
 *
 * @private
 */
async function _generateLatitude() {
  return await _generateCoordinate() - 38.5290245;
}

/**
 * Generates a random longitude
 *
 * @returns {Promise<number>} Represents a random longitude
 *
 * @private
 */
async function _generateLongitude() {
  return await _generateCoordinate() - 3.7506985;
}