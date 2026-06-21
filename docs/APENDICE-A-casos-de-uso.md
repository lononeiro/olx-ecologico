# APÊNDICE A — Diagrama de Casos de Uso

Diagrama de casos de uso do sistema **ECOnecta**, com os três atores (Cidadão, Empresa Coletora e
Administrador) e o caso de uso de autenticação compartilhado via `<<include>>`.

> Cole o bloco abaixo em <https://www.plantuml.com/plantuml/uml> ou use a extensão *PlantUML* no VS Code.

```plantuml
@startuml CasosDeUso_ECOnecta
left to right direction
skinparam packageStyle rectangle
skinparam actorStyle awesome

actor "Cidadão\n(usuario)" as Cidadao
actor "Empresa Coletora\n(empresa)" as Empresa
actor "Administrador\n(admin)" as Admin

rectangle "ECOnecta" {

  usecase "Cadastrar-se" as UC01
  usecase "Autenticar (Login)" as UC02
  usecase "Recuperar senha" as UC03
  usecase "Visualizar e editar perfil" as UC04

  ' --- Cidadão ---
  usecase "Criar solicitação de coleta" as UC05
  usecase "Anexar imagens (até 5)" as UC06
  usecase "Listar minhas solicitações" as UC07
  usecase "Acompanhar status da coleta" as UC08
  usecase "Conversar com a empresa" as UC09

  ' --- Empresa ---
  usecase "Ver solicitações aprovadas" as UC10
  usecase "Aceitar solicitação" as UC11
  usecase "Listar minhas coletas" as UC12
  usecase "Atualizar status da coleta" as UC13
  usecase "Concluir coleta com código" as UC14
  usecase "Conversar com o cidadão" as UC15

  ' --- Admin ---
  usecase "Visualizar dashboard" as UC16
  usecase "Analisar solicitações" as UC17
  usecase "Aprovar / rejeitar solicitação" as UC18
  usecase "Gerenciar usuários" as UC19
  usecase "Gerenciar empresas" as UC20
  usecase "Gerenciar materiais" as UC21
}

' ---- Associações: Cidadão ----
Cidadao --> UC01
Cidadao --> UC02
Cidadao --> UC03
Cidadao --> UC04
Cidadao --> UC05
Cidadao --> UC07
Cidadao --> UC08
Cidadao --> UC09

' ---- Associações: Empresa ----
Empresa --> UC01
Empresa --> UC02
Empresa --> UC03
Empresa --> UC04
Empresa --> UC10
Empresa --> UC11
Empresa --> UC12
Empresa --> UC13
Empresa --> UC15

' ---- Associações: Admin ----
Admin --> UC02
Admin --> UC16
Admin --> UC17
Admin --> UC18
Admin --> UC19
Admin --> UC20
Admin --> UC21

' ---- Relações include / extend ----
UC05 ..> UC06 : <<include>>
UC13 <.. UC14 : <<extend>>
UC18 ..> UC17 : <<include>>

UC04 ..> UC02 : <<include>>
UC05 ..> UC02 : <<include>>
UC07 ..> UC02 : <<include>>
UC08 ..> UC02 : <<include>>
UC09 ..> UC02 : <<include>>
UC10 ..> UC02 : <<include>>
UC11 ..> UC02 : <<include>>
UC12 ..> UC02 : <<include>>
UC13 ..> UC02 : <<include>>
UC15 ..> UC02 : <<include>>
UC16 ..> UC02 : <<include>>
UC17 ..> UC02 : <<include>>
UC19 ..> UC02 : <<include>>
UC20 ..> UC02 : <<include>>
UC21 ..> UC02 : <<include>>

@enduml
```

### Imagem renderizada

![Diagrama de Casos de Uso](diagrams/APENDICE-A-1.png)

## Resumo dos casos de uso

| ID | Caso de uso | Ator(es) |
|----|-------------|----------|
| UC01 | Cadastrar-se (como cidadão ou empresa) | Cidadão, Empresa |
| UC02 | Autenticar (Login) | Todos |
| UC03 | Recuperar senha | Cidadão, Empresa |
| UC04 | Visualizar e editar perfil | Cidadão, Empresa |
| UC05 | Criar solicitação de coleta | Cidadão |
| UC06 | Anexar imagens (até 5) | Cidadão |
| UC07 | Listar minhas solicitações | Cidadão |
| UC08 | Acompanhar status da coleta | Cidadão |
| UC09 | Conversar com a empresa | Cidadão |
| UC10 | Ver solicitações aprovadas disponíveis | Empresa |
| UC11 | Aceitar solicitação | Empresa |
| UC12 | Listar minhas coletas | Empresa |
| UC13 | Atualizar status da coleta | Empresa |
| UC14 | Concluir coleta com código de confirmação | Empresa |
| UC15 | Conversar com o cidadão | Empresa |
| UC16 | Visualizar dashboard | Administrador |
| UC17 | Analisar solicitações | Administrador |
| UC18 | Aprovar / rejeitar solicitação | Administrador |
| UC19 | Gerenciar usuários | Administrador |
| UC20 | Gerenciar empresas | Administrador |
| UC21 | Gerenciar materiais | Administrador |
