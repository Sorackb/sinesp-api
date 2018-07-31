const moment = require('moment');
const crypto = require('crypto');
const fs     = require('fs');
const axios  = require('axios');
const xml2js = require('xml2js');
const path   = require('path');

const PLATE_FORMAT = /^[a-zA-Z]{3}[0-9]{4}$/gim;
const SPECIAL      = /[^a-zA-Z0-9]/gi;
const URL          = 'https://cidadao.sinesp.gov.br/sinesp-cidadao/mobile/consultar-placa/v4';
const SECRET       = '#8.1.0#g8LzUadkEHs7mbRqbX5l';
const HEADERS      = {
  'User-Agent': 'SinespCidadao / 3.0.2.1 CFNetwork / 758.2.8 Darwin / 15.0.0',
  'Host': 'cidadao.sinesp.gov.br'
};

let definition = {};
let xml;

definition.search = _search;

module.exports = definition;

_init();

function _init() {
  xml = fs.readFileSync(path.join(__dirname, 'body.xml')).toString();
}

async function _search(plate) {
  let body  = await _generateBody(plate);

  return _request(body);
}

async function _validate(plate) {
  plate = plate.replace(SPECIAL, '');

  if (!PLATE_FORMAT.test(plate)) {
    throw new Error('Formato de placa inválido! Utilize o formato "AAA999" ou "AAA-9999".');
  }

  return plate;
}

async function _generateBody(plate) {
  let now                          = new Date();
  let result                       = xml;
  let valid                        = await _validate(plate);
  let [latitude, longitude, token] = await Promise.all([
    _generateLatitude(),
    _generateLongitude(),
    _generateToken(valid)
  ]);

  result = result.replace('{LATITUDE}', latitude);
  result = result.replace('{LONGITUDE}', longitude);
  result = result.replace('{DATE}', moment(now).format('YYYY-MM-DD HH:mm:ss'));
  result = result.replace('{TOKEN}', token);
  result = result.replace('{PLATE}', valid);

  return result;
}

async function _request(body) {
  let {data} = await axios({
    method: 'POST',
    url: URL,
    data: body,
    encoding: 'binary',
    headers: HEADERS
  });

  return await normalize(data);
}

async function normalize(returnedXML) {
  let {['soap:Envelope']: {['soap:Body']: {[0]: {['ns2:getStatusResponse']: {[0]: {return: {[0]: envelope}}}}}}} = await new Promise((resolve, reject) => xml2js.parseString(returnedXML, (err, json) => {
    if (err) reject(err);
    else resolve(json);
  }));

  let result = {};

  for (let key in envelope) {
    if (envelope.hasOwnProperty(key)) result[key] = envelope[key][0];
  }

  return result;
}

async function _generateToken(plate) {
  let created = crypto.createHmac('sha1', plate + SECRET);

  created.update(plate);

  return created.digest('hex');
}

async function _generateCoordinate() {
  let seed;

  seed = 2000 / Math.sqrt(Math.random());
  seed = seed * Math.sin(2 * 3.141592654 * Math.random());

  return seed;
}

async function _generateLatitude() {
  return await _generateCoordinate() - 38.5290245;
}

async function _generateLongitude() {
  return await _generateCoordinate() - 3.7506985;
}