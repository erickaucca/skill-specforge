# Regras de Domínio — [NOME_DO_PROJETO]

> **Atenção:** este arquivo contém exemplos do mercado segurador brasileiro.
> Substitua pelas regras reais do seu projeto antes de usar em produção.
> O Claude lê este arquivo em toda sessão para gerar specs e código alinhados ao domínio.

---

## Cotação

Regras que determinam elegibilidade, cálculo de prêmio e validade de propostas.

- **COBERTURA_MINIMA**: toda cotação deve incluir ao menos a cobertura básica obrigatória definida pela SUSEP para o ramo; coberturas adicionais são opcionais.
- **VIGENCIA_PROPOSTA**: propostas de cotação têm validade de 30 dias corridos a partir da data de emissão; após esse prazo, os valores devem ser recalculados.
- **FRACIONAMENTO_PREMIO**: o prêmio pode ser fracionado em até 12 parcelas, mas o valor mínimo por parcela é R$ 50,00; fracionamentos que resultem em parcelas menores devem ser recusados.

## Emissão

Regras que governam a formalização e vigência das apólices.

- **INICIO_VIGENCIA**: a vigência da apólice só começa após confirmação do pagamento da primeira parcela; emissões com início retroativo são bloqueadas salvo autorização explícita da área técnica.
- **ENDOSSO_RETROATIVO**: endossos com efeito retroativo superior a 30 dias requerem aprovação da subscrição e registro de justificativa no histórico da apólice.
- **CANCELAMENTO_PRO_RATA**: no cancelamento por solicitação do segurado, o prêmio devolvido é calculado pro rata die sobre o período não decorrido, deduzido o IOF já recolhido.

## Sinistro

Regras de aviso, regulação e pagamento de indenizações.

- **PRAZO_AVISO**: o segurado tem prazo de 30 dias para avisar o sinistro após a data do evento; avisos fora do prazo devem ser registrados mas passam por análise de cobertura antes de qualquer regulação.
- **FRANQUIA_DEDUTIVEL**: o valor da franquia ou dedutível é abatido da indenização bruta antes do pagamento; sinistros cujo valor regulado seja inferior à franquia resultam em indenização zero, sem cancelamento da apólice.
- **SUBROGACAO**: após o pagamento da indenização, a seguradora sub-roga nos direitos do segurado contra terceiros responsáveis pelo sinistro; o sistema deve registrar o valor sub-rogado para acompanhamento de recuperação.

## Resseguro

Regras de cessão e recuperação junto a resseguradoras.

- **LIMITE_RETENCAO**: sinistros que superem o limite de retenção configurado para o ramo devem acionar automaticamente o aviso ao ressegurador dentro do prazo contratual (normalmente 72h úteis).
- **FACULTATIVO_VS_AUTOMATICO**: riscos acima do pleno de aceitação automática requerem colocação facultativa antes da emissão da apólice; a emissão não pode ser concluída sem o número de aceitação do ressegurador.
- **BORDEREAU**: os bordereaux de prêmio e sinistro devem ser gerados com periodicidade mensal e enviados às resseguradoras até o 5º dia útil do mês subsequente.

## Cosseguro

Regras de divisão de risco entre seguradoras.

- **SEGURADORA_LIDER**: em operações de cosseguro, uma única seguradora é designada líder e é responsável pela emissão da apólice, relacionamento com o segurado e regulação de sinistros; as cosseguradoras participam apenas financeiramente.
- **PROPORCIONALIDADE**: prêmios e sinistros são rateados entre as cosseguradoras estritamente na proporção das participações acordadas; qualquer ajuste de participação após emissão requer endosso assinado por todas as partes.
- **CONTA_CORRENTE**: os repasses financeiros entre líder e cosseguradoras devem ser liquidados mensalmente via conta-corrente de cosseguro, com prazo máximo de 30 dias após o fechamento do mês.
