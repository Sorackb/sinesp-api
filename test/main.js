/* eslint-disable */
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { join } = require('path');
const { readFileSync } = require('fs');
const { configure } = require('../.');

chai.use(chaiAsPromised);

const expect = chai.expect;
const results = JSON.parse(readFileSync(join(__dirname, 'results.json')));
const proxies = JSON.parse(readFileSync(join(__dirname, 'proxies.json')));

describe('search', function () {
  let proxy = {};

  if (process.env.PROXY) {
    const chosen = proxies[Math.floor(Math.random() * proxies.length)];
    proxy = chosen;
  }

  const { search } = configure({
    timeout: 0,
    host: 'cidadao.sinesp.gov.br',
    endpoint: '/sinesp-cidadao/mobile/consultar-placa/',
    serviceVersion: 'v4',
    androidVersion: '8.1.0',
    secret: 'g8LzUadkEHs7mbRqbX5l',
    maximumRetry: 3,
    proxy: {
      host: proxy.host,
      port: proxy.port,
    }
  });

  const plates = Object.keys(results);
  const plate1 = plates[Math.floor(Math.random() * plates.length)];

  it(`Success: ${plate1}`, async function () {
    this.timeout(300000);
    this.retries(4);
    const vehicle = await search(plate1);

    return expect(vehicle)
      .to.deep.include(results[plate1])
      .to.contain.keys('data', 'dataAtualizacaoAlarme', 'dataAtualizacaoRouboFurto', 'dataAtualizacaoCaracteristicasVeiculo');
  });

  const plate2 = plates[Math.floor(Math.random() * plates.length)];
  const formated = plate2.replace(/([a-zA-Z]{3})([0-9]{4})/, '$1-$2');

  it(`Success: ${formated}`, async function () {
    this.timeout(300000);
    this.retries(4);
    const vehicle = await search(formated);

    return expect(vehicle)
      .to.deep.include(results[plate2])
      .to.contain.keys('data', 'dataAtualizacaoAlarme', 'dataAtualizacaoRouboFurto', 'dataAtualizacaoCaracteristicasVeiculo');
  });

  it('Fail: no parameter provided', async () => expect(search()).to.be.rejectedWith('Formato de placa inválido! Utilize o formato "AAA9999" ou "AAA-9999".'));
  it('Fail: empty plate', async () => expect(search('')).to.be.rejectedWith('Formato de placa inválido! Utilize o formato "AAA9999" ou "AAA-9999".'));
  it('Fail: bad format', async () => expect(search('AAAAAAA')).to.be.rejectedWith('Formato de placa inválido! Utilize o formato "AAA9999" ou "AAA-9999".'));

  it('Fail: not found', async function () {
    this.timeout(300000);
    this.retries(4);

    return expect(search('ZZZ9999')).to.be.rejectedWith('Veículo não encontrado');
  });

  it('Fail: Wrong URL', async function() {
    this.timeout(300000);

    const { search } = configure({
      endpoint: '/errado-sinesp-cidadao/mobile/consultar-placa/',
      maximumRetry: 3,
      proxy: {},
    });

    return expect(search('ZZZ9999')).to.be.rejected;
  });
});
