/**
 * @file Manages the wrapper of SINESP's search for plates
 *
 * @author Lucas Bernardo
 *
 * @requires NPM:xml2js
 * @requires NPM:axios
 */

const { createHmac } = require('crypto');
const { promisify } = require('util');

const { parseString, Builder } = require('xml2js');
const axios = require('axios');

const promisedParseString = promisify(parseString);

const HOST = 'cidadao.sinesp.gov.br';
const SERVICE_VERSION = 'v4';
const URL = `https://${HOST}/sinesp-cidadao/mobile/consultar-placa/${SERVICE_VERSION}`;

const ANDROID_VERSION = '8.1.0';
const SECRET = `#${ANDROID_VERSION}#g8LzUadkEHs7mbRqbX5l`;

/**
 * The accepted format: AAA0000
 *
 * @constant
 *
 * @type {RegExp}
 */
const PLATE_FORMAT = /^[a-zA-Z]{3}[0-9]{4}$/im;
const SPECIAL = /[^a-zA-Z0-9]/i;

const HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'User-Agent': 'SinespCidadao / 3.0.2.1 CFNetwork / 758.2.8 Darwin / 15.0.0',
  Host: HOST
};

/**
 * Validate the format of the plate informed
 *
 * @param {string} plate - The informed plate
 *
 * @returns {Promise<*>} Represents the plate without special characters
 *
 * @private
 */
async function validate(plate) {
  const usedPlate = plate.replace(SPECIAL, '');

  if (!PLATE_FORMAT.test(usedPlate)) {
    throw new Error('Formato de placa inválido! Utilize o formato "AAA9999" ou "AAA-9999".');
  }

  return usedPlate;
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
async function normalize(returnedXML) {
  const { 'soap:Envelope': { 'soap:Body': { 'ns2:getStatusResponse': { return: envelope } } } } = await promisedParseString(returnedXML, { explicitArray: false });

  if (parseInt(envelope.codigoRetorno, 10) !== 0) {
    throw Error(envelope.mensagemRetorno);
  }

  return envelope;
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
async function generateToken(plate) {
  const created = createHmac('sha1', `${plate}${SECRET}`);

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
async function generateCoordinate() {
  let seed;

  seed = 2000 / Math.sqrt(Math.random());
  seed *= Math.sin(2 * 3.141592654 * Math.random());

  return seed;
}

/**
 * Generates a random latitude
 *
 * @returns {Promise<number>} Represents a random latitude
 *
 * @private
 */
async function generateLatitude() {
  return await generateCoordinate() - 38.5290245;
}

/**
 * Generates a random longitude
 *
 * @returns {Promise<number>} Represents a random longitude
 *
 * @private
 */
async function generateLongitude() {
  return await generateCoordinate() - 3.7506985;
}

/**
 * Generates the date formatted by 'YYYY-MM-DD HH:mm:ss'
 *
 * @param {Date} date - The date to be formatted
 *
 * @returns {Promise<string>} Represents the formatted date
 *
 * @private
 */
async function formatDate(date) {
  const year = date.getFullYear();
  const month = (`00${date.getMonth() + 1}`).slice(-2);
  const day = (`00${date.getDate()}`).slice(-2);
  const hour = (`00${date.getHours()}`).slice(-2);
  const minute = (`00${date.getMinutes()}`).slice(-2);
  const second = (`00${date.getSeconds()}`).slice(-2);

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
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
async function request(body) {
  const { data } = await axios({
    method: 'POST',
    url: URL,
    data: body,
    encoding: 'binary',
    headers: HEADERS,
  });

  return normalize(data);
}

/**
 * Generates the XML body in the format expected by the SINESP's service
 *
 * @param {string} plate - Treated and informed plate
 *
 * @returns {Promise<string>} Represents the filled XML to be sent
 *
 * @private
 */
async function generateBody(plate) {
  const builder = new Builder({ rootName: 'v:Envelope' });
  const usedPlate = await validate(plate);

  const [latitude, longitude, token, date] = await Promise.all([
    generateLatitude(),
    generateLongitude(),
    generateToken(usedPlate),
    formatDate(new Date()),
  ]);

  const body = {
    $: {
      'xmlns:v': 'http://schemas.xmlsoap.org/soap/envelope/',
    },
    'v:Header': {
      b: 'LGE Nexus 5',
      j: '',
      i: latitude,
      c: 'ANDROID',
      d: ANDROID_VERSION,
      e: '4.1.5',
      f: '127.0.0.1',
      g: token,
      k: '',
      h: longitude,
      l: date,
      m: '8797e74f0d6eb7b1ff3dc114d4aa12d3',
    },
    'v:Body': {
      $: {
        'xmlns:n0': 'http://soap.ws.placa.service.sinesp.serpro.gov.br/',
      },
      'n0:getStatus': {
        a: plate,
      }
    }
  };

  return builder.buildObject(body);
}

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
async function search(plate = '') {
  const body = await generateBody(plate);

  return request(body);
}

module.exports = { search };
