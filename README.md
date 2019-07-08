# sinesp-api

[![NPM version][npm-img]][npm]
[![Build Status][ci-img]][ci]
[![Coverage Status][coveralls-img]][coveralls]
[![Dependency Status][dep-img]][dep]
[![devDependency Status][devDep-img]][devDep]
[![Greenkeeper badge][greenkeeper-img]][greenkeeper]

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
[greenkeeper-img]: https://badges.greenkeeper.io/Sorackb/sinesp-api.svg
[greenkeeper]:     https://greenkeeper.io/

| PagSeguro       | PayPal          |
| :-------------: | :-------------: |
[![Doe com PagSeguro - é rápido, grátis e seguro!](https://stc.pagseguro.uol.com.br/public/img/botoes/doacoes/209x48-doar-laranja-assina.gif)](https://pag.ae/bhmK2Xf) | [![Make a donation](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=LKDGCQBKYBW5E)

Módulo do Node.js que permite a consulta de placa no território nacional utilizando a base de dados do Sistema Nacional de Informações de Segurança Pública (SINESP).

## Pré-requisitos

- A origem de utilização deve ser do Brasil. Caso seja utilizado um cliente com outra origem será necessário o uso de proxy;
- Versões do Node.js anteriores a 8 não são compatíveis;
- Entre a versão 8 e 10 do Node.js há compatibilidade total;
- A partir da versão 11 do Node.js é necessário utilizar o argumento [`--tls-min-v1.0`](https://nodejs.org/api/tls.html#tls_tls_default_min_version);

## Instalação

```
$ npm install sinesp-api --save
```

## API

<dl>
<dt><a href="#search">search(plate)</a> ⇒ <code>Promise.&lt;object&gt;</code></dt>
<dd><p>Busca o veículo pela placa</p>
</dd>
<dt><a href="#configure">configure([host], [endpoint], [serviceVersion], [androidVersion], [proxy])</a> ⇒</dt>
<dd><p>Configura o módulo</p>
</dd>
</dl>

## search(plate) ⇒ <code>Promise.&lt;object&gt;</code>
Busca o veículo pela placa

**Retorna**: <code>Promise.&lt;object&gt;</code> - A representação do veículo identificado pela placa

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| plate | <code>string</code> | A placa do veículo a ser consultada |

**Example**
```js
let vehicle = await search('AAA111');
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

## configure([host], [endpoint], [serviceVersion], [androidVersion], [proxy]) ⇒
Configura o módulo

**Retorna**: O próprio módulo

| Parâmetro | Tipo | Default | Descrição |
| --- | --- | --- | --- |
| [host] | <code>string</code> | <code>&quot;cidadao.sinesp.gov.br&quot;</code> | Host do serviço SINESP |
| [endpoint] | <code>string</code> | <code>&quot;/sinesp-cidadao/mobile/consultar-placa/&quot;</code> | Endpoint do serviço SINESP |
| [serviceVersion] | <code>string</code> | <code>&quot;v5&quot;</code> | Versão do serviço SINESP |
| [androidVersion] | <code>string</code> | <code>&quot;6.0&quot;</code> | Versão do Android a ser informada para o serviço SINESP |
| [secret] | <code>string</code> | <code>&quot;0KnlVSWHxOih3zKXBWlo&quot;</code> | A chave usada para encriptar a placa |
| [timeout] | <code>number</code> | <code>0</code> | req/res timeout em ms, reseta ao seguir redirecionamentos. 0 para desabilitar (Limite do SO aplicado) |
| [maximumRetry] | <code>number</code> | <code>0</code> | Número máximo de tentativas se a requisição falhar |
| [proxy] | <code>object</code> | <code>{}</code> | O objeto com configurações de proxy, caso exista |

---

## Atenção

Esta implementação não possui nenhum vínculo oficial com o Sistema Nacional de Informações de Segurança Pública (SINESP). Não há garantias de funcionamento após atualizações da API.
