const sinespAPI = require('../sinesp-api');
const chai      = require('chai');
const path      = require('path');

const expect  = chai.expect;
const RESULTS = require(path.join(__dirname, 'results.json'));

function wrapError(e) {
  throw e;
}

describe('search', function() {
  it('Fail bad format', async function() {
    try {
      await sinespAPI.search('AAAAAAA');
    } catch(e) {
      return expect(() => wrapError(e)).to.throw('Formato de placa inválido! Utilize o formato "AAA999" ou "AAA-9999"');
    }
  });

  it('Plate: ABC1234', async function() {
    return expect(await sinespAPI.search('ABC1234')).to.deep.include(RESULTS['ABC1234']);
  });
});