# sinesp-api

| PagSeguro     | PayPal      |
| ------------- |-------------|
[![Doe com PagSeguro - é rápido, grátis e seguro!](https://stc.pagseguro.uol.com.br/public/img/botoes/doacoes/209x48-doar-laranja-assina.gif)](https://pag.ae/bhmK2Xf) | [![Make a donation](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=LKDGCQBKYBW5E)
 
Módulo do Node.js que permite a consulta de placa no território nacional utilizando a base de dados do Sistema Nacional de Informações de Segurança Pública (SINESP).

Para consultar utilize a função `search` enviando a placa desejada como parâmetro.

## Exemplo

```javascript
var sinesp = require('sinesp-api');

sinesp.search('ABC1234')
    .then(JSON.stringify)
    .then(console.log)
    .catch(console.error);
```

### Saída

```json
{
  "codigoRetorno": "0",
  "mensagemRetorno": "Sem erros.",
  "codigoSituacao": "0",
  "situacao": "Sem restrição",
  "modelo": "VW/SANTANA CG",
  "marca": "VW/SANTANA CG",
  "cor": "VERMELHA",
  "ano": "1986",
  "anoModelo": "1986",
  "placa": "ABC1234",
  "data": "07/08/2017 às 11:34:28",
  "uf": "PR",
  "municipio": "LOBATO",
  "chassi": "************46344"
}
```

---

### Atenção

Esta implementação não possui nenhum vínculo oficial com o Sistema Nacional de Informações de Segurança Pública (SINESP).