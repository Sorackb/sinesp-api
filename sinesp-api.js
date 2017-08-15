var definition = {};

var moment  = require('moment');
var uuidv4  = require('uuid/v4');
var crypto  = require('crypto');
var fs      = require('fs');
var request = require('request');
var xml2js  = require('xml2js');
var xml;

const PLATE_FORMAT = /^[a-zA-Z]{3}[0-9]{4}$/gim;
const SPECIAL      = /[^a-zA-Z0-9]/gi;
const URL          = 'https://sinespcidadao.sinesp.gov.br/sinesp-cidadao/mobile/consultar-placa/v2';
const SECRET       = 'XvAmRTGhQchFwzwduKYK';
const HEADERS      = {
  'User-Agent': 'SinespCidadao / 3.0.2.1 CFNetwork / 758.2.8 Darwin / 15.0.0',
  'Host': 'sinespcidadao.sinesp.gov.br'
};

definition.search = _search;

module.exports = definition;

_init();

function _init() {
  xml = fs.readFileSync('./body.xml').toString();
}

function _search(plate) {
  return new Promise(function(resolve, reject) {
    _validate(plate)
        .then(_generateBody)
        .then(_request)
        .then(resolve)
        .catch(reject);
  });
}

function _validate(plate) {
  return new Promise(function(resolve, reject) {
    plate = plate.replace(SPECIAL, '');

    if (PLATE_FORMAT.test(plate)) {
      resolve(plate);
    } else {
      reject('Formato de placa inválido! Utilize o formato "AAA999" ou "AAA-9999".');
    }
  });
}

function _generateBody(plate) {
  return new Promise(function(resolve, reject) {
    var now = new Date();
    var result;

    result = xml;
    result = result.replace('{LATITUDE}', _generateLatitude());
    result = result.replace('{LONGITUDE}', _generateLongitude());
    result = result.replace('{DATE}', moment(now).format('YYYY-MM-DD HH:mm:ss'));
    result = result.replace('{TOKEN}', _generateToken(plate));
    result = result.replace('{PLATE}', plate);
    result = result.replace('{UUID}', uuidv4());
    resolve(result);
  });
}

function _request(body) {
  return new Promise(function(resolve, reject) {
    request.post({
      url: URL,
      body: body,
      rejectUnauthorized: false,
      encoding: 'binary',
      headers: HEADERS
    }, function(error, response, result) {
      if (error) {
        reject(error);
        return;
      }

      normalize(result)
          .then(resolve)
          .catch(reject);
    });
  });
}

function normalize(returnedXML) {
  return new Promise(function(resolve, reject) {
    var result = {};

    xml2js.parseString(returnedXML, function(err, json) {
      if (err) {
        reject(err);
        return;
      }

      json = json['soap:Envelope']['soap:Body'][0]['ns2:getStatusResponse'][0].return[0];

      for (var key in json) {
        result[key] = json[key][0];
      }

      resolve(result);
    });
  });
}

function _generateToken(plate) {
  var hmac = crypto.createHmac('sha1', plate + SECRET);

  hmac.update(plate);

  return hmac.digest('hex');
}

function _generateCoordinate() {
  var seed;

  seed = 2000 / Math.sqrt(Math.random());
  seed = seed * Math.sin(2 * 3.141592654 * Math.random());

  return seed;
}

function _generateLatitude() {
  return _generateCoordinate() - 38.5290245;
}

function _generateLongitude() {
  return _generateCoordinate() - 3.7506985;
}