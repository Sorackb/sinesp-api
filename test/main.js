const sinespAPI      = require('../sinesp-api');
const chai           = require('chai');
const chaiAsPromised = require('chai-as-promised');
const path           = require('path');

chai.use(chaiAsPromised);

const expect  = chai.expect;
const RESULTS = require(path.join(__dirname, 'results.json'));

describe('search', function() {
  it('Success: ABC1234', async function() {
    return expect(sinespAPI.search('ABC1234')).to.eventually.deep.include(RESULTS['ABC1234']);
  });

  it('Fail: bad format', async function() {
    return expect(sinespAPI.search('AAAAAAA')).to.be.rejectedWith('Formato de placa inválido! Utilize o formato "AAA999" ou "AAA-9999".');
  });

  it('Fail: not found', async function() {
    return expect(sinespAPI.search('ZZZ9999')).to.be.rejectedWith('Veículo não encontrado');
  });
});