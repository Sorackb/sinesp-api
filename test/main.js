const {search}       = require('../.');
const chai           = require('chai');
const chaiAsPromised = require('chai-as-promised');
const {join}         = require('path');

chai.use(chaiAsPromised);

const expect  = chai.expect;
const RESULTS = require(join(__dirname, 'results.json'));

describe('search', function() {
  /** Success tests **/
  for (let plate of Object.keys(RESULTS)) {
    it(`Success: ${plate}`, async function() {
      let vehicle = await search(plate);

      return expect(vehicle)
          .to.deep.include(RESULTS[plate])
          .to.contain.keys('data', 'dataAtualizacaoAlarme', 'dataAtualizacaoRouboFurto', 'dataAtualizacaoCaracteristicasVeiculo');
    });
  }

  it('Fail: no parameter provided', async function() {
    return expect(search()).to.be.rejectedWith('Formato de placa inválido! Utilize o formato "AAA9999" ou "AAA-9999".');
  });

  it('Fail: bad format', async function() {
    return expect(search('AAAAAAA')).to.be.rejectedWith('Formato de placa inválido! Utilize o formato "AAA9999" ou "AAA-9999".');
  });

  it('Fail: not found', async function() {
    return expect(search('ZZZ9999')).to.be.rejectedWith('Veículo não encontrado');
  });
});