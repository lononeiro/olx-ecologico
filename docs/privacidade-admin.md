# Politica interna de privacidade administrativa

## Usuario comum

Pode ver os dados completos das proprias solicitacoes, incluindo endereco de coleta e dados da empresa quando houver coleta aceita. O chat fica separado e e carregado somente por `/api/mensagens/[coletaId]`.

## Empresa

Antes do aceite, a empresa ve somente solicitacoes aprovadas e ainda sem coleta. O payload nao inclui nome, email, telefone nem endereco de perfil do solicitante. O endereco de coleta aparece apenas como regiao aproximada.

Depois do aceite, a empresa pode ver os dados necessarios para executar a coleta: endereco exato da coleta, nome e contato do solicitante, material, quantidade, imagens e status operacional. Endereco do perfil do solicitante nao aparece no detalhe da empresa.

## Admin

Na fila de solicitacoes, o admin ve apenas dados minimos: id, titulo, material, status, data, coleta/empresa e regiao aproximada. A listagem nao exibe nome do solicitante, email, telefone, endereco completo ou mensagens.

No detalhe de moderacao, o admin ve os dados necessarios para aprovar ou rejeitar a solicitacao. Email e telefone aparecem mascarados por padrao. Chat nao e carregado automaticamente.

Na listagem de usuarios, telefone nao aparece e email e mascarado. Dados completos de contato devem ficar restritos a telas justificadas por suporte ou administracao.

## Dados nunca exibidos por padrao

Email completo, telefone completo, endereco completo de perfil e historico de chat nao devem aparecer em listagens ou payloads genericos. Qualquer exibicao de dados pessoais completos deve ser vinculada a uma finalidade operacional clara e registrada em auditoria.

## Auditoria

Acesso a dados pessoais completos e abertura de chat devem registrar usuario, data, recurso acessado e acao. Os eventos atuais usam `auditAccess` e podem ser direcionados futuramente para tabela propria ou provedor de logs.
