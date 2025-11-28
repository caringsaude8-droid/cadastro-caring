# API de Beneficiários - Documentação

## Endpoint de Inclusão de Beneficiários

**URL:** `POST http://localhost:8081/api/cadastro/v1/beneficiarios`

### Headers Obrigatórios
```
Content-Type: application/json
X-Empresa-Id: {id_da_empresa}
X-Empresa-Codigo: {codigo_da_empresa}
```

### Formato JSON da Requisição

```json
{
  "benEmpId": 1,
  "benTipoMotivo": "Inclusão por admissão",
  "benCodUnimedSeg": "12345",
  "benRelacaoDep": "0",
  "benDtaNasc": "1990-05-15",
  "benSexo": "M",
  "benEstCivil": "SOLTEIRO",
  "benDtaInclusao": "2025-11-28",
  "benPlanoProd": "APARTAMENTO",
  "benNomeSegurado": "João Silva Santos",
  "benCpf": "12345678901",
  "benCidade": "São Paulo",
  "benUf": "SP",
  "benAdmissao": "2024-01-15",
  "benNomeDaMae": "Maria Silva Santos",
  "benEndereco": "Rua das Flores, 123",
  "benComplemento": "Apto 45",
  "benBairro": "Centro",
  "benCep": "01234567",
  "benMatricula": "EMP001234",
  "benDddCel": "11",
  "benEmail": "joao.silva@email.com",
  "benDataCasamento": "2020-06-15",
  "benIndicPesTrans": "N",
  "benNomeSocial": null,
  "benIdentGenero": null,
  "benCodCartao": "CARD123456"
}
```

### Campos Obrigatórios
- `nomeSegurado`: Nome completo do beneficiário
- `cpf`: CPF sem formatação (apenas números)
- `dataNascimento`: Data no formato "YYYY-MM-DD"
- `sexo`: "M" para Masculino, "F" para Feminino
- `relacaoDependencia`: Valores aceitos:
  - "TITULAR"
  - "CONJUGE" 
  - "FILHO"
  - "DEPENDENTE"
- `planoProduto`: Tipo de acomodação/plano
- `codigoEmpresa`: Código da empresa vinculada
- `numeroEmpresa`: Número da empresa

### Campos Opcionais

#### Estado Civil
Valores aceitos: "SOLTEIRO", "CASADO", "DIVORCIADO", "VIUVO", "SEPARADO"

#### Tipos de Telefone
- "RESIDENCIAL"
- "CELULAR" 
- "COMERCIAL"

#### Tipos de Anexo
- "RG"
- "CPF"
- "CERTIDAO_NASCIMENTO"
- "CERTIDAO_CASAMENTO"
- "COMPROVANTE_RESIDENCIA"
- "DECLARACAO_NASCIDO_VIVO"
- "CARTEIRA_VACINACAO"

### Resposta da API

#### Sucesso (201 Created)
```json
{
  "id": 123,
  "nomeSegurado": "João Silva Santos",
  "cpf": "12345678901",
  "matriculaBeneficiario": "BEN001234",
  "matriculaTitular": "TIT001234",
  "status": "ATIVO",
  "dataInclusao": "2024-11-28T10:30:00Z",
  "codigoEmpresa": "12345"
}
```

#### Erro (400 Bad Request)
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Dados inválidos",
  "details": [
    {
      "field": "cpf",
      "message": "CPF já cadastrado para esta empresa"
    },
    {
      "field": "dataNascimento", 
      "message": "Data de nascimento inválida"
    }
  ]
}
```

## Outros Endpoints

### Listar Beneficiários
```
GET http://localhost:8081/api/cadastro/v1/beneficiarios?codigoEmpresa={codigo}
```

### Alterar Beneficiário
```
PUT http://localhost:8081/api/cadastro/v1/beneficiarios/{id}/alteracao
```

### Excluir Beneficiário
```
DELETE http://localhost:8081/api/cadastro/v1/beneficiarios/{id}/exclusao
Body: { "motivoExclusao": "RESCISAO" }
```

## Interceptor de Empresa

O sistema automaticamente adiciona os headers `X-Empresa-Id` e `X-Empresa-Codigo` baseado na empresa selecionada no contexto global.

## Exemplo de Uso no Angular

```typescript
const request: InclusaoBeneficiarioRequest = {
  nomeSegurado: "João Silva",
  cpf: "12345678901", 
  dataNascimento: "1990-05-15",
  sexo: "M",
  relacaoDependencia: "TITULAR",
  planoProduto: "APARTAMENTO",
  codigoEmpresa: "12345",
  numeroEmpresa: "67890"
};

this.beneficiariosService.incluirBeneficiario(request).subscribe({
  next: (beneficiario) => {
    console.log('Beneficiário incluído:', beneficiario);
  },
  error: (error) => {
    console.error('Erro:', error);
  }
});
```

## Validações da API

### CPF
- Deve ser um CPF válido
- Não pode estar duplicado para a mesma empresa
- Apenas números (sem formatação)

### Data de Nascimento
- Formato YYYY-MM-DD
- Não pode ser futura
- Idade mínima/máxima conforme regras de negócio

### Anexos
- Tamanho máximo por arquivo: 5MB
- Formatos aceitos: PDF, JPG, PNG
- Conteúdo deve ser válido em base64