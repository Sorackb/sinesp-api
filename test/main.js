/* eslint-disable */
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { join } = require('path');
const { readFileSync } = require('fs');
const { configure } = require('../.');
const { retry } = require('../tools');

const NO_ANONYMITY = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\:(\d{1,})[ ]BR\-N.+\+/g;
const ANONYMITY = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\:(\d{1,})[ ]BR\-A.+\+/g;
const HIGH_ANONYMITY = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\:(\d{1,})[ ]BR\-H.+\+/g;
const PROXY = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\:(\d{1,})/;

chai.use(chaiAsPromised);

const FORMAT_MESSAGE = 'Formato de placa inválido! Utilize o formato "LLLNLNN", "LLLNNLN" ou "LLLNNNN" (em que L é letra e N, número).';
const expect = chai.expect;
const results = JSON.parse(readFileSync(join(__dirname, 'results.json')));

describe('search', function () {
  let search;

  before(async function () {
    let proxy;

    // Search by a avaible proxy leading by High Anonymity, followed by Anonymity and finally by No Anonymity
    if (process.env.PROXY) {
      const { body:data } = await retry({ url: 'http://spys.me/proxy.txt', method: 'GET' });
      const proxies = data.match(HIGH_ANONYMITY) || data.match(ANONYMITY) || data.match(NO_ANONYMITY);
      const chosen = proxies[Math.floor(Math.random() * proxies.length)];
      const [all, host, port] = PROXY.exec(chosen);
      proxy = { host, port };
    };

    search = configure({
      proxy,
      timeout: 0,
      host: 'apicarros.com',
      endpoint: 'consulta',
      serviceVersion: 'v1',
      maximumRetry: 3,
    }).search;
  });

  const plates = Object.keys(results);
  const plate0 = 'LSU3J43';

  it(`Success: ${plate0}`, async function() {
    this.timeout(300000);
    this.retries(4);
    const vehicle = await search(plate0);

    return expect(vehicle)
      .to.deep.include(results[plate0])
      .to.contain.keys('data', 'dataAtualizacaoAlarme', 'dataAtualizacaoRouboFurto', 'dataAtualizacaoCaracteristicasVeiculo');
  });

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

  it('Fail: no parameter provided', async () => expect(search()).to.be.rejectedWith(FORMAT_MESSAGE));
  it('Fail: empty plate', async () => expect(search('')).to.be.rejectedWith(FORMAT_MESSAGE));
  it('Fail: bad format', async () => expect(search('AAAAAAA')).to.be.rejectedWith(FORMAT_MESSAGE));

  it('Fail: not found', async function () {
    this.timeout(300000);
    this.retries(4);

    return expect(search('ZZZ9999')).to.be.rejectedWith('Nenhum veículo foi encontrado para a placa ZZZ9999');
  });

  it('Fail: Wrong URL', async function() {
    this.timeout(300000);

    const { search } = configure({
      host: 'errado.sinesp.gov.br',
      maximumRetry: 2,
      proxy: {},
    });

    return expect(search('ZZZ9999')).to.be.rejectedWith('ENOTFOUND errado.sinesp.gov.br');
  });
});
