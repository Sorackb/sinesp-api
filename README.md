# sinesp-api

[![Greenkeeper badge][greenkeeper-img]][greenkeeper]

[greenkeeper-img]: https://badges.greenkeeper.io/Sorackb/sinesp-api.svg
[greenkeeper]:     https://greenkeeper.io/

| PagSeguro       | PayPal          |
| :-------------: | :-------------: |
[![Doe com PagSeguro - é rápido, grátis e seguro!](https://stc.pagseguro.uol.com.br/public/img/botoes/doacoes/209x48-doar-laranja-assina.gif)](https://pag.ae/bhmK2Xf) | [![Make a donation](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=LKDGCQBKYBW5E)
 
Módulo do Node.js que permite a consulta de placa no território nacional utilizando a base de dados do Sistema Nacional de Informações de Segurança Pública (SINESP).

## Instalação

```
$ npm install sinesp-api --save
```

## API

### search(plate)

Para consultar utilize a função `search` enviando a placa desejada como parâmetro.

| Nome        | Tipo     | Requerido | Descrição        |
| ----------- | :------: | :-------: | ---------------- |
| `plate`     | *string* | Sim       | Placa do veículo |

### Exemplo de utilização

```js
const { search } = require('sinesp-api')();

search('ABC1234').then(veiculo => console.log(JSON.stringify(veiculo)));
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

---

## Atenção

Esta implementação não possui nenhum vínculo oficial com o Sistema Nacional de Informações de Segurança Pública (SINESP) e não há garantias de funcionamento. Não há garantias de funcionamento após atualizações da API.
