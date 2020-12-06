# sinesp-api

[![NPM version][npm-img]][npm]
[![Build Status][ci-img]][ci]
[![Coverage Status][coveralls-img]][coveralls]
[![Dependency Status][dep-img]][dep]
[![devDependency Status][devDep-img]][devDep]
[![snyk badge][snyk-img]][snyk]
[![node badge][node-img]][node]

[npm-img]:         https://img.shields.io/npm/v/sinesp-api.svg
[npm]:             https://www.npmjs.com/package/sinesp-api
[ci-img]:          https://travis-ci.org/Sorackb/sinesp-api.svg
[ci]:              https://travis-ci.org/Sorackb/sinesp-api
[coveralls-img]:   https://coveralls.io/repos/github/Sorackb/sinesp-api/badge.svg?branch=master
[coveralls]:       https://coveralls.io/github/Sorackb/sinesp-api?branch=master
[dep-img]:         https://david-dm.org/Sorackb/sinesp-api.svg
[dep]:             https://david-dm.org/Sorackb/sinesp-api
[devDep-img]:      https://david-dm.org/Sorackb/sinesp-api/dev-status.svg
[devDep]:          https://david-dm.org/Sorackb/sinesp-api#info=devDependencies
[snyk-img]:        https://snyk.io/test/github/Sorackb/sinesp-api/badge.svg
[snyk]:            https://snyk.io/test/github/Sorackb/sinesp-api
[node-img]:        https://img.shields.io/node/v/mocha.svg
[node]:            https://nodejs.org/en/

| PagSeguro       | PayPal          |
| :-------------: | :-------------: |
[![Doe com PagSeguro - é rápido, grátis e seguro!](https://stc.pagseguro.uol.com.br/public/img/botoes/doacoes/209x48-doar-laranja-assina.gif)](https://pag.ae/bhmK2Xf) | [![Make a donation](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=LKDGCQBKYBW5E)

Módulo do Node.js que permite a consulta de placa no território nacional utilizando a base de dados da [API-Carros](https://github.com/100n0m3/API-Carros).

## Pré-requisitos

- Versões do Node.js anteriores a 8 não são compatíveis;

## Instalação

```
$ npm install sinesp-api --save
```

## API

<dl>
<dt><a href="#search">search(plate)</a> ⇒ <code>Promise.&lt;object&gt;</code></dt>
<dd><p>Busca o veículo pela placa</p>
</dd>
<dt><a href="#configure">configure([host], [endpoint], [serviceVersion], [proxy])</a> ⇒</dt>
<dd><p>Configura o módulo</p>
</dd>
</dl>

## search(plate) ⇒ <code>Promise.&lt;object&gt;</code>
Busca o veículo pela placa

**Retorna**: <code>Promise.&lt;object&gt;</code> - A representação do veículo identificado pela placa

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| plate | <code>string</code> | A placa do veículo a ser consultada |

**Exemplo**
```js
const sinespApi = require('sinesp-api');

let vehicle = await sinespApi.search('AAA111');
```

### Saída

```json
{
    "codigoRetorno":                         "0",
    "mensagemRetorno":                       "Sem erros.",
    "codigoSituacao":                        "0",
    "situacao":                              "Sem restrição",
    "modelo":                                "FIAT/UNO MILLE EP",
    "marca":                                 "FIAT/UNO MILLE EP",
    "cor":                                   "BRANCA",
    "ano":                                   "1996",
    "anoModelo":                             "1996",
    "placa":                                 "ABC1234",
    "data":                                  "02/08/2018 às 02:52:34",
    "uf":                                    "DF",
    "municipio":                             "BRASILIA",
    "chassi":                                "99092",
    "dataAtualizacaoCaracteristicasVeiculo": "13/04/2018",
    "dataAtualizacaoRouboFurto":             "01/08/2018",
    "dataAtualizacaoAlarme":                 "01/08/2018"
}
```

<a name="configure"></a>

## configure([host], [endpoint], [serviceVersion], [timeout], [maximumRetry], [proxy]) ⇒
Configura o módulo

**Retorna**: O próprio módulo

| Parâmetro | Tipo | Default | Descrição |
| --- | --- | --- | --- |
| [host] | <code>string</code> | <code>&quot;apicarros.com&quot;</code> | Host do serviço SINESP |
| [endpoint] | <code>string</code> | <code>&quot;consulta&quot;</code> | Endpoint do serviço SINESP |
| [serviceVersion] | <code>string</code> | <code>&quot;v1&quot;</code> | Versão do serviço SINESP |
| [timeout] | <code>number</code> | <code>0</code> | req/res timeout em ms, reseta ao seguir redirecionamentos. 0 para desabilitar (Limite do SO aplicado) |
| [maximumRetry] | <code>number</code> | <code>0</code> | Número máximo de tentativas se a requisição falhar |
| [proxy] | <code>object</code> | <code>{}</code> | O objeto com configurações de proxy, caso exista |

---

## Atenção

Esta implementação não possui nenhum vínculo oficial com o Sistema Nacional de Informações de Segurança Pública (SINESP). Utilizamos a [API-Carros](https://github.com/100n0m3/API-Carros) para a obtenção dos dados e deixamos aqui nosso agradecimento pela disponilização do serviço.
