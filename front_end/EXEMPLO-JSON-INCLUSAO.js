// Exemplo de JSON que seria gerado pelo formulário de inclusão atual
// Baseado no formato real da API /api/cadastro/v1/beneficiarios

const exemploJSONCompleto = {
  // === DADOS OBRIGATÓRIOS ===
  "benEmpId": 1,                        // ID da empresa (vem do contexto)
  "benNomeSegurado": "Maria Santos Silva",
  "benCpf": "12345678901", 
  "benRelacaoDep": "0",                 // "0" = Titular, "1" = Dependente
  
  // === DADOS BÁSICOS OPCIONAIS ===
  "benTipoMotivo": "Inclusão por admissão",
  "benCodUnimedSeg": "12345",
  "benDtaNasc": "1985-03-20",           // Formato ISO YYYY-MM-DD
  "benSexo": "F",                       // M ou F
  "benEstCivil": "CASADO",              // SOLTEIRO, CASADO, DIVORCIADO, VIUVO
  "benDtaInclusao": "2025-11-28",       // Data atual
  "benPlanoProd": "APARTAMENTO",
  
  // === DADOS PESSOAIS ===
  "benNomeDaMae": "Ana Santos Silva",
  "benDataCasamento": "2020-06-15",
  
  // === ENDEREÇO ===
  "benEndereco": "Rua das Palmeiras, 456",
  "benComplemento": "Casa 2",
  "benBairro": "Jardim Paulista",
  "benCidade": "São Paulo", 
  "benUf": "SP",
  "benCep": "01234567",
  
  // === CONTATO ===
  "benDddCel": "11",
  "benEmail": "maria.santos@email.com",
  
  // === DOCUMENTOS E TRABALHO ===
  "benMatricula": "EMP001234",
  "benAdmissao": "2024-01-15",
  
  // === PESSOA TRANS ===
  "benIndicPesTrans": "S",              // S = Sim, N = Não
  "benNomeSocial": "Maria Silva",
  "benIdentGenero": "Feminino",
  
  // === OUTROS ===
  "benCodCartao": "CARD123456",
  "benTitularId": null                  // Null se for titular, ID do titular se for dependente
};

/* === MAPEAMENTO DOS CAMPOS DO FORMULÁRIO ===

Campos diretos (novos nomes da API):
form.nomeSegurado        -> benNomeSegurado
form.cpf                 -> benCpf  
form.nomeMae            -> benNomeDaMae
form.email              -> benEmail
form.planoProd          -> benPlanoProd

Campos com conversão:
form.dataNascimento     -> benDtaNasc (DD/MM/YYYY -> YYYY-MM-DD)
form.admissao           -> benAdmissao (DD/MM/YYYY -> YYYY-MM-DD)
form.sexo               -> benSexo
form.relacaoDep         -> benRelacaoDep ("titular" -> "0", "dependente" -> "1")

Campos de endereço:
form.endereco           -> benEndereco
form.complemento        -> benComplemento
form.bairro             -> benBairro
form.cidade             -> benCidade
form.uf                 -> benUf
form.cep                -> benCep

Campos de contato:
form.dddCelular         -> benDddCel
form.email              -> benEmail

Campos funcionais:
form.matricula          -> benMatricula
form.dataCasamento      -> benDataCasamento

Campos pessoa trans:
form.indicadorPessoaTrans -> benIndicPesTrans ("sim" -> "S", "nao" -> "N")
form.nomeSocial         -> benNomeSocial
form.identidadeGenero   -> benIdentGenero

Campos da empresa (contexto):
empresaSelecionada.id   -> benEmpId

*/

export { exemploJSONCompleto };