const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { join } = require('path');
const { readFileSync } = require('fs');
const { search } = require('../.');

chai.use(chaiAsPromised);

const expect = chai.expect;
const results = JSON.parse(readFileSync(join(__dirname, 'results.json')));

describe('search', () => {
  /** Success tests * */
  Object.keys(results).forEach((plate) => {
    it(`Success: ${plate}`, async () => {
      const vehicle = await search(plate);

      return expect(vehicle)
        .to.deep.include(results[plate])
        .to.contain.keys('data', 'dataAtualizacaoAlarme', 'dataAtualizacaoRouboFurto', 'dataAtualizacaoCaracteristicasVeiculo');
    });
  });

  it('Fail: no parameter provided', async () => expect(search()).to.be.rejectedWith('Formato de placa inválido! Utilize o formato "AAA9999" ou "AAA-9999".'));
  it('Fail: empty plate', async () => expect(search('')).to.be.rejectedWith('Formato de placa inválido! Utilize o formato "AAA9999" ou "AAA-9999".'));
  it('Fail: bad format', async () => expect(search('AAAAAAA')).to.be.rejectedWith('Formato de placa inválido! Utilize o formato "AAA9999" ou "AAA-9999".'));
  it('Fail: not found', async () => expect(search('ZZZ9999')).to.be.rejectedWith('Veículo não encontrado'));
});
