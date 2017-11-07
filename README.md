# Nerraw

Nerraw é um app que permite comprar e vender Bitcoins utilizando o terminal utilizando a Foxbit (ou qualquer outra corretora Blinktrade).

### Pre-requisitos
Você precisa do **nodeJS** e do **npm** instalados no computador para executar o Nerraw.


### Instalando

Para instalar o nerraw na sua máquina, faça o clone deste repositório (*branch master*) e execute os seguintes comandos:

```
npm install
```

Este comando irá instalar todos os pré-requisitos para o projeto ser executado.

Dentro da pasta /src você irá encontrar o arquivo *config.js.sample*, você deve renomeá-lo para *config.js* e adicionar os dados da sua API, fornecidos pela sua corretora (apenas corretoras da rede blinktrade são suportadas).


```
npm run build
```

Este comando irá gerar o código para ser executado. Este comando deve ser executado sempre que você fizer qualquer alteração no código source do projeto (inclusive nas configurações).


### Executando o Nerraw

```
npm run app
```
Este comando irá executar o Nerraw e fornecerá as informações da corretora e as opções disponíveis.


### Como contribuir para este projeto?

Você pode contribuir com este projeto de diversas maneiras:
- Testando e dando feeedback
- Divulgando
- Reportando bugs e solicitando novas funcionalidades (através da abertura de issue)
- Resolvendo issues abertas
- Melhorando o código ou implementando novas funcionalidades (os pull-requests devem ser feitos na branch dev)
