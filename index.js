/**
 * @file Manages the wrapper of SINESP's search for plates
 *
 * @author Lucas Bernardo
 *
 * @requires NPM:xml2js
 * @requires NPM:node-fetch
 * @requires NPM:https-proxy-agent
 */

const { createHmac } = require('crypto');
const { promisify } = require('util');

const { parseString, Builder } = require('xml2js');
const fetch = require('node-fetch');
const HttpsProxyAgent = require('https-proxy-agent');

const promisedParseString = promisify(parseString);

/**
 * The accepted format: AAA0000
 *
 * @constant
 *
 * @type {RegExp}
 */
const PLATE_FORMAT = /^[a-zA-Z]{3}[0-9]{4}$/im;
const SPECIAL = /[^a-zA-Z0-9]/i;

let opts = {
  host: 'cidadao.sinesp.gov.br',
  endpoint: '/sinesp-cidadao/mobile/consultar-placa/',
  serviceVersion: 'v4',
  androidVersion: '8.1.0',
  proxy: {},
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
const validate = async (plate) => {
  const usedPlate = plate.replace(SPECIAL, '');

  if (!PLATE_FORMAT.test(usedPlate)) {
    throw new Error('Formato de placa inválido! Utilize o formato "AAA9999" ou "AAA-9999".');
  }

  return usedPlate;
};

/**
 * Transforms the answered XML in a JSON
 *
 * @param {string} returnedXML - The answered XML
 *
 * @returns {Promise<void>} Represents the JSON filled with the XML response
 *
 * @private
 */
const normalize = async (returnedXML) => {
  const { 'soap:Envelope': { 'soap:Body': { 'ns2:getStatusResponse': { return: envelope } } } } = await promisedParseString(returnedXML, { explicitArray: false });

  if (parseInt(envelope.codigoRetorno, 10) !== 0) {
    throw Error(envelope.mensagemRetorno);
  }

  return envelope;
};

/**
 * Create the token using 'SHA-1' algoritm based on the plate and the secret
 *
 * @param {string} plate - The plate to be searched
 *
 * @returns {Promise<*>} Represents the created token
 *
 * @private
 */
const generateToken = async (plate) => {
  const secret = `#${opts.androidVersion}#g8LzUadkEHs7mbRqbX5l`;

  return createHmac('sha1', `${plate}${secret}`)
    .update(plate)
    .digest('hex');
};

/**
 * Generates the coordinates used in the request
 *
 * @returns {Promise<number>} Represents a random coordinate
 *
 * @private
 */
const generateCoordinate = async () => {
  let seed;

  seed = 2000 / Math.sqrt(Math.random());
  seed *= Math.sin(2 * 3.141592654 * Math.random());

  return seed;
};

/**
 * Generates a random latitude
 *
 * @returns {Promise<number>} Represents a random latitude
 *
 * @private
 */
const generateLatitude = async () => await generateCoordinate() - 38.5290245;

/**
 * Generates a random longitude
 *
 * @returns {Promise<number>} Represents a random longitude
 *
 * @private
 */
const generateLongitude = async () => await generateCoordinate() - 3.7506985;

/**
 * Generates the date formatted by 'YYYY-MM-DD HH:mm:ss'
 *
 * @param {Date} date - The date to be formatted
 *
 * @returns {Promise<string>} Represents the formatted date
 *
 * @private
 */
const formatDate = async (date) => {
  const year = date.getFullYear();
  const month = (`00${date.getMonth() + 1}`).slice(-2);
  const day = (`00${date.getDate()}`).slice(-2);
  const hour = (`00${date.getHours()}`).slice(-2);
  const minute = (`00${date.getMinutes()}`).slice(-2);
  const second = (`00${date.getSeconds()}`).slice(-2);

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

/**
 * Send the request to SINESP's 'search by plate' service
 *
 * @param {string} body - The XML expected by SINESP's service
 *
 * @returns {Promise<*>} Represents the JSON filled with the SINESP's service response
 *
 * @private
 */
const request = async (body) => {
  const url = `https://${opts.host}${opts.endpoint}${opts.serviceVersion}`;

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'User-Agent': 'SinespCidadao / 3.0.2.1 CFNetwork / 758.2.8 Darwin / 15.0.0',
    Host: opts.host,
  };

  const agent = opts.proxy.host ? new HttpsProxyAgent(`http://${opts.proxy.host}:${opts.proxy.port}`) : null;

  const response = await fetch(url, {
    body,
    headers,
    agent,
    method: 'POST',
  });

  if (response.status !== 200) {
    throw new Error(await response.text());
  }

  return normalize(await response.text());
};

/**
 * Generates the XML body in the format expected by the SINESP's service
 *
 * @param {string} plate - Treated and informed plate
 *
 * @returns {Promise<string>} Represents the filled XML to be sent
 *
 * @private
 */
const generateBody = async (plate) => {
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
      c: 'ANDROID',
      d: opts.androidVersion,
      e: '4.3.2',
      f: '127.0.0.1',
      g: token,
      h: longitude,
      i: latitude,
      j: '',
      k: '',
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
 * @returns {Promise<*>} Represents the vehicle identified by the plate
 */
const search = async (plate = '') => {
  const body = await generateBody(plate);

  return request(body);
};

const configure = ({
  host,
  serviceVersion,
  androidVersion,
  endpoint,
  proxy = {},
} = {}) => {
  opts = {
    host: host || opts.host,
    endpoint: endpoint || opts.endpoint,
    serviceVersion: serviceVersion || opts.serviceVersion,
    androidVersion: androidVersion || opts.serviceVersion,
    proxy: {
      host: proxy.host || opts.proxy.host,
      port: proxy.port || opts.proxy.port,
    },
  };

  return { search };
};

module.exports = {
  configure,
  search
};
