/* eslint-disable no-undef,prefer-arrow-callback */
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { join } = require('path');
const { readFileSync } = require('fs');
const { configure } = require('../.');

chai.use(chaiAsPromised);

const expect = chai.expect;
const results = JSON.parse(readFileSync(join(__dirname, 'results.json')));

describe('search', function () {
  configure({
    timeout: 0,
    host: 'cidadao.sinesp.gov.br',
    endpoint: '/sinesp-cidadao/mobile/consultar-placa/',
    serviceVersion: 'v4',
    androidVersion: '8.1.0',
    secret: 'g8LzUadkEHs7mbRqbX5l',
    maximumRetry: 3,
    proxy: {
      host: process.env.PROXY_HOST,
      port: process.env.PROXY_PORT,
    }
  });

  const { search } = configure();

  /** Success tests * */
  Object.keys(results).forEach(function (plate) {
    it(`Success: ${plate}`, async function () {
      this.timeout(300000);
      this.retries(4);
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
    this.timeout(300000);
    this.retries(4);

    return expect(search('ZZZ9999')).to.be.rejectedWith('Veículo não encontrado');
  });
  it('Fail: Should raise an error in retry method', async function () {
    this.timeout(30000);
    const searchWithError =
      configure({
        timeout: 0,
        host: 'incorrect-host.sinesp.gov.br',
        endpoint: '/sinesp-cidadao/mobile/consultar-placa/',
        serviceVersion: 'v4',
        androidVersion: '8.1.0',
        secret: 'g8LzUadkEHs7mbRqbX5l',
        maximumRetry: 0,
        proxy: {
          host: process.env.PROXY_HOST,
          port: process.env.PROXY_PORT,
        }
      }).search;
  
    return expect(searchWithError('ZZZ9999')).to.be.rejectedWith("request to https://incorrect-host.sinesp.gov.br/sinesp-cidadao/mobile/consultar-placa/v4 failed, reason: getaddrinfo ENOTFOUND incorrect-host.sinesp.gov.br incorrect-host.sinesp.gov.br:443");
  })
});
