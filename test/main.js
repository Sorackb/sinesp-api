/* eslint-disable no-undef,prefer-arrow-callback */
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { join } = require('path');
const { readFileSync } = require('fs');
const { configure } = require('../.');

chai.use(chaiAsPromised);

const expect = chai.expect;
let results = JSON.parse(readFileSync(join(__dirname, 'results.json')));

// Just one because sometimes build fails with many results
if (process.env.ONLY_ONE) {
  results = {
    AAA1111: results.AAA1111
  };
}

describe('search', function () {
  const { search } = configure({
    timeout: 0,
    proxy: {
      host: process.env.PROXY_HOST,
      port: process.env.PROXY_PORT,
    }
  });

  /** Success tests * */
  Object.keys(results).forEach(function (plate) {
    it(`Success: ${plate}`, async function () {
      this.timeout(10000);
      const vehicle = await search(plate);

      return expect(vehicle)
        .to.deep.include(results[plate])
        .to.contain.keys('data', 'dataAtualizacaoAlarme', 'dataAtualizacaoRouboFurto', 'dataAtualizacaoCaracteristicasVeiculo');
    });
  });

  it('Fail: no parameter provided', async () => expect(search()).to.be.rejectedWith('Formato de placa inválido! Utilize o formato "AAA9999" ou "AAA-9999".'));
  it('Fail: empty plate', async () => expect(search('')).to.be.rejectedWith('Formato de placa inválido! Utilize o formato "AAA9999" ou "AAA-9999".'));
  it('Fail: bad format', async () => expect(search('AAAAAAA')).to.be.rejectedWith('Formato de placa inválido! Utilize o formato "AAA9999" ou "AAA-9999".'));

  it('Fail: not found', async function () {
    this.timeout(10000);

    return expect(search('ZZZ9999')).to.be.rejectedWith('Veículo não encontrado');
  });
});
