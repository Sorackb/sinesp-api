/**
 * @file Manages the wrapper of SINESP's search for plates
 *
 * @author Lucas Bernardo
 *
 * @requires NPM:xml2js
 */

const { createHmac } = require('crypto');
const { promisify } = require('util');

const { parseString, Builder } = require('xml2js');

const { retry } = require('./tools');
const { getValidToken: getFirebaseToken } = require('./firebaseTools');

const promisedParseString = promisify(parseString);

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
const FIREBASE_ID = /([^:]+)(:.+)/;

const DEFAULT = {
  host: 'cidadao.sinesp.gov.br',
  endpoint: '/sinesp-cidadao/mobile/consultar-placa/',
  serviceVersion: 'v5',
  androidVersion: '6.0',
  appVersion: '4.7.4',
  secret: '0KnlVSWHxOih3zKXBWlo',
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
 * Transforms the answered XML in a JSON
 *
 * @param {string} returnedXML - The answered XML
 *
 * @returns {Promise<object>} Represents the JSON filled with the XML response
 *
 * @private
 */
const convert = async (returnedXML) => {
  const { 'soap:Envelope': {
    'soap:Body': {
      'ns2:getStatusResponse': {
        return: envelope
      }
    }
  } } = await promisedParseString(returnedXML, { explicitArray: false });

  if (parseInt(envelope.codigoRetorno, 10) !== 0) {
    throw Error(envelope.mensagemRetorno);
  }

  return envelope;
};

/**
 * Generates a octet from 1 to 255
 *
 * @returns {Promise<number>} Represents a random octet
 *
 * @private
 */
const generateRandomOctet = async () => (Math.floor(Math.random() * 255) + 1);

/**
 * Generates a random IP address
 *
 * @returns {Promise<string>} Represents a random IP address
 *
 * @private
 */
const generateIPAddress = async () => {
  const [octet1, octet2, octet3, octet4] = await Promise.all([
    generateRandomOctet(),
    generateRandomOctet(),
    generateRandomOctet(),
    generateRandomOctet(),
  ]);

  return `${octet1}.${octet2}.${octet3}.${octet4}`;
};

/**
 * Create the token using 'SHA-1' algoritm based on the plate and the secret
 *
 * @param {string} plate - The plate to be searched
 *
 * @returns {Promise<string>} Represents the created token
 *
 * @private
 */
const generateToken = async (plate) => {
  const secret = `#${opts.androidVersion}#${opts.secret}`;

  return createHmac('sha1', `${plate}${secret}`)
    .update(plate)
    .digest('hex');
};

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
 * @param {string} firebaseToken - The Firebase generated Id
 *
 * @returns {Promise<object>} Represents the JSON filled with the SINESP's service response
 *
 * @private
 */
const request = async (body, firebaseToken) => {
  const url = `https://${opts.host}${opts.endpoint}${opts.serviceVersion}`;

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'User-Agent': 'SinespCidadao / 3.0.2.1 CFNetwork / 758.2.8 Darwin / 15.0.0',
    'Content-length': body.length,
    Authorization: `Token ${firebaseToken}`,
    Accept: 'text/xml',
    Host: opts.host,
  };

  const proxy = opts.proxy.host ? `http://${opts.proxy.host}:${opts.proxy.port}` : null;

  const options = {
    url,
    body,
    headers,
    proxy,
    method: 'POST',
    timeout: opts.timeout,
  };

  const response = await retry(options, 0, 0, opts.maximumRetry);

  return convert(response);
};

/**
 * Generates the XML body in the format expected by the SINESP's service
 *
 * @param {string} plate - Treated and informed plate
 * @param {string} firebaseToken - The Firebase generated Id
 *
 * @returns {Promise<string>} Represents the filled XML to be sent
 *
 * @private
 */
const generateBody = async (plate, firebaseToken) => {
  const builder = new Builder({ rootName: 'v:Envelope' });
  const plateToUse = await validate(plate);
  const [all, authorization] = FIREBASE_ID.exec(firebaseToken);

  const [ip, token, date] = await Promise.all([
    generateIPAddress(),
    generateToken(plateToUse),
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
      e: opts.appVersion,
      f: ip,
      g: token,
      h: 0,
      i: 0,
      j: '',
      k: '',
      l: date,
      m: '8797e74f0d6eb7b1ff3dc114d4aa12d3',
      n: authorization,
    },
    'v:Body': {
      $: {
        'xmlns:n0': 'http://soap.ws.placa.service.sinesp.serpro.gov.br/',
      },
      'n0:getStatus': {
        a: plateToUse,
      },
    },
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
 * @returns {Promise<object>} Represents the vehicle identified by the plate
 */
const search = async (plate = '') => {
  const firebaseToken = await getFirebaseToken(opts.appVersion);
  const body = await generateBody(plate, firebaseToken);

  return request(body, firebaseToken);
};

/**
 * Configure the module
 *
 * @param {string} [host=cidadao.sinesp.gov.br] - Host of SINESP service
 * @param {string} [endpoint=/sinesp-cidadao/mobile/consultar-placa/] - Endpoint of SINESP service
 * @param {string} [serviceVersion=v5] - Service version of SINESP
 * @param {string} [androidVersion=6.0] - Android version to inform to the SINESP service
 * @param {string} [appVersion=4.7.4] - The version of the SINESP's app
 * @param {string} [secret=0KnlVSWHxOih3zKXBWlo] - The secred used to encrypt the plate
 * @param {number} [timeout=0] - req/res timeout in ms, it resets on redirect.
 *                               0 to disable (OS limit applies)
 * @param {number} [maximumRetry=0] - Maximum retrys if the request fail
 * @param {object} [proxy={}] - The proxy object if exists
 *
 * @returns The module it self
 */
const configure = ({
  host,
  serviceVersion,
  androidVersion,
  appVersion,
  endpoint,
  secret,
  timeout,
  maximumRetry,
  proxy = {},
} = {}) => {
  opts = {
    host: host || DEFAULT.host,
    endpoint: endpoint || DEFAULT.endpoint,
    serviceVersion: serviceVersion || DEFAULT.serviceVersion,
    androidVersion: androidVersion || DEFAULT.androidVersion,
    appVersion: appVersion || DEFAULT.appVersion,
    secret: secret || DEFAULT.secret,
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
