import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const endpoints = [
  { metodo: "POST", path: "/api/auth/register", titulo: "Registrar Usuário", desc: "Cria nova conta", auth: "Não", roles: [], parametros: [], corpo: [{ nome: "nome", tipo: "string", obr: true }, { nome: "email", tipo: "string", obr: true }, { nome: "senha", tipo: "string", obr: true }, { nome: "tipo", tipo: "string", obr: true }], respostas: [{ status: 201, desc: "Criado" }, { status: 409, desc: "Email existe" }] },
  { metodo: "GET", path: "/api/solicitacoes", titulo: "Listar Solicitações", desc: "Lista solicitações do usuário", auth: "Sim", roles: ["usuario", "admin", "empresa"], parametros: [], corpo: [], respostas: [{ status: 200, desc: "OK" }, { status: 401, desc: "Não autenticado" }] },
  { metodo: "POST", path: "/api/solicitacoes", titulo: "Criar Solicitação", desc: "Nova solicitação de coleta", auth: "Sim", roles: ["usuario"], parametros: [], corpo: [{ nome: "titulo", tipo: "string", obr: true }, { nome: "descricao", tipo: "string", obr: true }, { nome: "materiais", tipo: "array", obr: true }, { nome: "quantidade", tipo: "number", obr: true }], respostas: [{ status: 201, desc: "Criado" }, { status: 400, desc: "Erro" }] },
  { metodo: "GET", path: "/api/solicitacoes/[id]", titulo: "Obter Solicitação", desc: "Detalhes de solicitação", auth: "Sim", roles: ["usuario", "admin", "empresa"], parametros: [{ nome: "id", tipo: "number", obr: true }], corpo: [], respostas: [{ status: 200, desc: "OK" }, { status: 404, desc: "Não encontrado" }] },
  { metodo: "GET", path: "/api/empresa/coletas", titulo: "Listar Coletas", desc: "Coletas da empresa", auth: "Sim", roles: ["empresa"], parametros: [], corpo: [], respostas: [{ status: 200, desc: "OK" }] },
  { metodo: "POST", path: "/api/empresa/coletas", titulo: "Aceitar Solicitação", desc: "Cria coleta", auth: "Sim", roles: ["empresa"], parametros: [], corpo: [{ nome: "solicitacaoId", tipo: "number", obr: true }], respostas: [{ status: 201, desc: "Criado" }] },
  { metodo: "GET", path: "/api/empresa/coletas/[id]", titulo: "Obter Coleta", desc: "Detalhes coleta", auth: "Sim", roles: ["empresa", "usuario"], parametros: [{ nome: "id", tipo: "number", obr: true }], corpo: [], respostas: [{ status: 200, desc: "OK" }] },
  { metodo: "PATCH", path: "/api/empresa/coletas/[id]", titulo: "Atualizar Status", desc: "Muda status coleta", auth: "Sim", roles: ["empresa"], parametros: [{ nome: "id", tipo: "number", obr: true }], corpo: [{ nome: "status", tipo: "string", obr: true }], respostas: [{ status: 200, desc: "OK" }] },
  { metodo: "PATCH", path: "/api/admin/solicitacoes/[id]", titulo: "Aprovar Solicitação", desc: "Admin aprova/rejeita", auth: "Sim", roles: ["admin"], parametros: [{ nome: "id", tipo: "number", obr: true }], corpo: [{ nome: "aprovado", tipo: "boolean", obr: true }], respostas: [{ status: 200, desc: "OK" }] },
  { metodo: "GET", path: "/api/materiais", titulo: "Listar Materiais", desc: "Tipos de materiais", auth: "Não", roles: [], parametros: [], corpo: [], respostas: [{ status: 200, desc: "OK" }] },
  { metodo: "GET", path: "/api/mensagens/[id]", titulo: "Listar Mensagens", desc: "Mensagens da coleta", auth: "Sim", roles: ["usuario", "empresa"], parametros: [{ nome: "id", tipo: "number", obr: true }], corpo: [], respostas: [{ status: 200, desc: "OK" }] },
  { metodo: "POST", path: "/api/mensagens/[id]", titulo: "Enviar Mensagem", desc: "Nova mensagem", auth: "Sim", roles: ["usuario", "empresa"], parametros: [{ nome: "id", tipo: "number", obr: true }], corpo: [{ nome: "mensagem", tipo: "string", obr: true }], respostas: [{ status: 201, desc: "Criado" }] },
  { metodo: "GET", path: "/api/users/me", titulo: "Meu Perfil", desc: "Dados do usuário", auth: "Sim", roles: ["usuario", "admin", "empresa"], parametros: [], corpo: [], respostas: [{ status: 200, desc: "OK" }] },
];

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format") || "html";

  if (format === "json") {
    return NextResponse.json({ versao: "1.0.0", endpoints });
  }

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>API Reciclagem - Documentação</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f0f2f5; color: #333; line-height: 1.6; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 8px; margin-bottom: 30px; }
    header h1 { font-size: 2.2em; margin-bottom: 10px; }
    header p { font-size: 1em; opacity: 0.95; }
    .links { margin: 20px 0; display: flex; gap: 10px; }
    .links a { padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; }
    .links a:hover { background: #5568d3; }
    .endpoint { background: white; margin: 15px 0; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .endpoint-header { background: linear-gradient(90deg, #667eea, #764ba2); color: white; padding: 15px 20px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; }
    .endpoint-header:hover { background: linear-gradient(90deg, #5568d3, #6a4190); }
    .ep-left { display: flex; gap: 12px; align-items: center; }
    .method { font-weight: bold; padding: 4px 10px; background: rgba(255,255,255,0.2); border-radius: 3px; min-width: 60px; text-align: center; font-size: 0.9em; }
    .path { font-family: monospace; font-size: 0.95em; }
    .toggle { font-size: 1.2em; transition: transform 0.2s; }
    .endpoint.active .toggle { transform: rotate(180deg); }
    .endpoint-body { display: none; padding: 20px; border-top: 1px solid #eee; }
    .endpoint.active .endpoint-body { display: block; }
    .info { margin: 15px 0; }
    .info-title { font-weight: bold; color: #667eea; margin: 10px 0 8px 0; }
    .roles { color: #666; font-size: 0.95em; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 0.95em; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; font-weight: 600; color: #333; }
    tr:hover { background: #fafafa; }
    .code { background: #f5f5f5; padding: 8px 12px; border-radius: 3px; font-family: monospace; color: #333; }
    footer { background: white; padding: 20px; border-radius: 6px; text-align: center; margin-top: 30px; color: #666; }
    @media (max-width: 768px) { header h1 { font-size: 1.5em; } .ep-left { flex-direction: column; align-items: flex-start; gap: 6px; } }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📚 Documentação da API</h1>
      <p>API de Reciclagem - Gerenciamento de Coletas</p>
    </header>

    <div class="links">
      <a href="?format=html">🌐 HTML</a>
      <a href="?format=json">📦 JSON</a>
    </div>

    <div id="endpoints-container"></div>

    <footer>
      <p><strong>13 Endpoints • Versão 1.0.0</strong></p>
      <p>Autenticação: NextAuth.js | Base URL: /api</p>
    </footer>
  </div>

  <script>
    const endpoints = ${JSON.stringify(endpoints)};

    endpoints.forEach((ep, idx) => {
      const html = \`
        <div class="endpoint" onclick="this.classList.toggle('active')">
          <div class="endpoint-header">
            <div class="ep-left">
              <span class="method">\${ep.metodo}</span>
              <span class="path">\${ep.path}</span>
            </div>
            <span class="toggle">▼</span>
          </div>
          <div class="endpoint-body">
            <h3>\${ep.titulo}</h3>
            <p>\${ep.desc}</p>

            <div class="info">
              <div class="info-title">🔐 Autenticação</div>
              <p>\${ep.auth === 'Sim' ? '✅ Requerida' : '❌ Não requerida'}</p>
              \${ep.roles.length > 0 ? '<p class="roles"><strong>Roles:</strong> ' + ep.roles.join(', ') + '</p>' : ''}
            </div>

            \${ep.parametros?.length > 0 ? \`
              <div class="info">
                <div class="info-title">📥 Parâmetros</div>
                <table>
                  <tr><th>Nome</th><th>Tipo</th><th>Obrigatório</th></tr>
                  \${ep.parametros.map(p => '<tr><td>' + p.nome + '</td><td class="code">' + p.tipo + '</td><td>' + (p.obr ? '✓' : '○') + '</td></tr>').join('')}
                </table>
              </div>
            \` : ''}

            \${ep.corpo?.length > 0 ? \`
              <div class="info">
                <div class="info-title">📤 Corpo (JSON)</div>
                <table>
                  <tr><th>Campo</th><th>Tipo</th><th>Obrigatório</th></tr>
                  \${ep.corpo.map(b => '<tr><td>' + b.nome + '</td><td class="code">' + b.tipo + '</td><td>' + (b.obr ? '✓' : '○') + '</td></tr>').join('')}
                </table>
              </div>
            \` : ''}

            <div class="info">
              <div class="info-title">📝 Respostas</div>
              <table>
                <tr><th>Status</th><th>Descrição</th></tr>
                \${ep.respostas.map(r => '<tr><td class="code">' + r.status + '</td><td>' + r.desc + '</td></tr>').join('')}
              </table>
            </div>
          </div>
        </div>
      \`;
      document.getElementById('endpoints-container').innerHTML += html;
    });

    if (endpoints.length > 0) {
      document.querySelector('.endpoint')?.classList.add('active');
    }
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
