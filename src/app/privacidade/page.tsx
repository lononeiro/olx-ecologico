import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { TransitionLink } from "@/components/ui/TransitionLink";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Política de Privacidade — ECOnecta",
  description:
    "Como o ECOnecta trata seus dados pessoais: quais dados coletamos, para quê, o uso da localização, compartilhamento com terceiros e seus direitos conforme a LGPD.",
};

/** Última revisão da política — atualize ao alterar o conteúdo. */
const ATUALIZADO_EM = "13 de setembro de 2026";

export default function PrivacidadePage() {
  return (
    <main
      className={`${playfair.variable} ${dmSans.variable}`}
      style={{
        fontFamily: "var(--font-body)",
        background: "var(--landing-bg)",
        color: "var(--landing-text)",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.4rem 2.5rem",
          borderBottom: "1px solid var(--landing-border)",
        }}
      >
        <TransitionLink
          href="/"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.6rem",
            color: "var(--landing-accent)",
            textDecoration: "none",
          }}
        >
          ♻ ECOnecta
        </TransitionLink>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <ThemeToggle compact />
          <TransitionLink
            href="/login"
            style={{ color: "var(--landing-muted)", fontSize: "1rem", textDecoration: "none" }}
          >
            Entrar
          </TransitionLink>
        </div>
      </nav>

      <article style={{ maxWidth: 820, margin: "0 auto", padding: "4rem 1.5rem 6rem" }}>
        <p
          style={{
            color: "var(--landing-accent)",
            fontSize: ".8rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          Privacidade
        </p>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
            fontWeight: 700,
            lineHeight: 1.15,
            margin: ".6rem 0 1.2rem",
          }}
        >
          Política de Privacidade
        </h1>
        <p style={{ color: "var(--landing-soft)", fontSize: ".9rem", marginBottom: "1.2rem" }}>
          Última atualização: {ATUALIZADO_EM}
        </p>
        <p style={{ color: "var(--landing-muted)", fontSize: "1.1rem", lineHeight: 1.7, maxWidth: 640 }}>
          Esta política explica como o <strong>ECOnecta</strong> coleta, usa, compartilha e protege
          seus dados pessoais, em conformidade com a <strong>Lei Geral de Proteção de Dados
          (LGPD — Lei nº 13.709/2018)</strong>. Nosso princípio é simples: coletar o mínimo
          necessário e usar apenas para o funcionamento da plataforma.
        </p>

        <Section title="Quais dados tratamos" eyebrow="Coleta">
          <ul style={{ display: "grid", gap: ".75rem", margin: "1rem 0", listStyle: "none", padding: 0 }}>
            <li style={bullet}>
              <span style={badge}>Cadastro</span>
              <span style={itemText}>
                Nome, e-mail, senha (armazenada de forma criptografada) e o tipo de conta
                (cidadão, empresa ou administrador). Empresas podem informar dados adicionais
                de identificação.
              </span>
            </li>
            <li style={bullet}>
              <span style={badge}>Solicitações de coleta</span>
              <span style={itemText}>
                Material, quantidade, descrição, <strong>endereço da coleta</strong> e fotos
                enviadas por você. Esses dados são necessários para que as empresas parceiras
                possam localizar e realizar a coleta.
              </span>
            </li>
            <li style={bullet}>
              <span style={badge}>Mensagens</span>
              <span style={itemText}>
                Conteúdo das conversas trocadas entre cidadãos e empresas dentro da plataforma.
              </span>
            </li>
            <li style={bullet}>
              <span style={badge}>Localização</span>
              <span style={itemText}>
                A localização aproximada do seu dispositivo, <strong>apenas quando você autoriza</strong>
                {" "}o navegador a compartilhá-la (veja a seção específica abaixo).
              </span>
            </li>
          </ul>
        </Section>

        <Section title="Uso da sua localização" eyebrow="Ponto de atenção">
          <p style={paragraph}>
            No mapa de coletas, o site pode pedir acesso à sua localização para{" "}
            <strong>centralizar o mapa perto de você</strong> e facilitar a visualização das
            solicitações próximas. Sobre esse uso:
          </p>
          <ul style={{ display: "grid", gap: ".5rem", color: "var(--landing-muted)", lineHeight: 1.7, paddingLeft: "1.1rem", margin: "1rem 0" }}>
            <li>A localização só é obtida <strong>com o seu consentimento</strong>, através do pedido de permissão do próprio navegador.</li>
            <li>Ela é usada <strong>somente no seu navegador</strong>, para posicionar o mapa — <strong>não é enviada aos nossos servidores nem armazenada</strong>.</li>
            <li>Se você <strong>recusar</strong>, o mapa continua funcionando normalmente, apenas sem centralizar na sua posição.</li>
            <li>Você pode revogar essa permissão a qualquer momento nas configurações do navegador.</li>
          </ul>
        </Section>

        <Section title="Para que usamos os dados" eyebrow="Finalidade">
          <ul style={{ display: "grid", gap: ".5rem", color: "var(--landing-muted)", lineHeight: 1.7, paddingLeft: "1.1rem" }}>
            <li>Criar e autenticar sua conta e manter a plataforma segura.</li>
            <li>Publicar solicitações de coleta e conectá-las a empresas parceiras.</li>
            <li>Permitir a comunicação entre cidadãos e empresas.</li>
            <li>Exibir as coletas em um mapa e estimar o impacto ambiental das coletas concluídas.</li>
          </ul>
          <p style={{ ...paragraph, marginTop: "1rem" }}>
            Tratamos os dados com base na <strong>execução do serviço</strong> que você solicita, no
            seu <strong>consentimento</strong> (por exemplo, para a localização) e no{" "}
            <strong>legítimo interesse</strong> de conectar cidadãos a empresas de reciclagem.
          </p>
        </Section>

        <Section title="Compartilhamento com terceiros" eyebrow="Transparência">
          <p style={paragraph}>
            Não vendemos seus dados. O compartilhamento ocorre apenas quando necessário ao
            funcionamento da plataforma:
          </p>
          <ul style={{ display: "grid", gap: ".75rem", margin: "1rem 0", listStyle: "none", padding: 0 }}>
            <li style={bullet}>
              <span style={badge}>Empresas parceiras</span>
              <span style={itemText}>
                Ao publicar uma coleta, seus dados da solicitação (incluindo endereço) ficam
                visíveis para as empresas parceiras que podem aceitá-la.
              </span>
            </li>
            <li style={bullet}>
              <span style={badge}>Serviço de mapas</span>
              <span style={itemText}>
                Para exibir os endereços no mapa, utilizamos o serviço de geocodificação{" "}
                <a
                  href="https://www.openstreetmap.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={link}
                >
                  OpenStreetMap / Nominatim ↗
                </a>
                . Isso implica o envio do texto do endereço a esse serviço, que pode estar
                localizado fora do Brasil (transferência internacional de dados).
              </span>
            </li>
          </ul>
        </Section>

        <Section title="Seus direitos" eyebrow="LGPD">
          <p style={paragraph}>
            A LGPD garante a você, como titular dos dados, o direito de:
          </p>
          <ul style={{ display: "grid", gap: ".5rem", color: "var(--landing-muted)", lineHeight: 1.7, paddingLeft: "1.1rem", margin: "1rem 0" }}>
            <li>Confirmar a existência de tratamento e <strong>acessar</strong> seus dados.</li>
            <li><strong>Corrigir</strong> dados incompletos, inexatos ou desatualizados.</li>
            <li>Solicitar a <strong>eliminação</strong> dos dados tratados com base no consentimento.</li>
            <li><strong>Revogar o consentimento</strong> a qualquer momento.</li>
            <li>Solicitar a <strong>portabilidade</strong> e obter informações sobre o compartilhamento.</li>
          </ul>
          <p style={paragraph}>
            Boa parte desses direitos pode ser exercida diretamente na plataforma — por exemplo,
            editando seu perfil em <strong>Meu Perfil</strong> ou gerenciando suas solicitações.
            Para os demais pedidos, entre em contato pelo canal abaixo.
          </p>
        </Section>

        <Section title="Segurança e retenção" eyebrow="Proteção">
          <p style={paragraph}>
            Adotamos medidas técnicas para proteger seus dados, como senhas armazenadas de forma
            criptografada e controle de acesso por tipo de conta. Mantemos os dados apenas
            enquanto forem necessários às finalidades descritas ou por exigência legal.
          </p>
        </Section>

        <Section title="Contato" eyebrow="Fale conosco">
          <p style={paragraph}>
            Para dúvidas sobre privacidade ou para exercer seus direitos, entre em contato pelo
            e-mail{" "}
            <a href="mailto:lucas.gama@aedb.br" style={link}>
              lucas.gama@aedb.br
            </a>
            .
          </p>
        </Section>

        <p style={{ ...paragraph, fontSize: ".85rem", color: "var(--landing-soft)", marginTop: "2.5rem" }}>
          O ECOnecta é um projeto acadêmico. Esta política tem caráter informativo e pode ser
          atualizada; a data da última revisão é indicada no topo desta página.
        </p>

        <div
          style={{
            marginTop: "3rem",
            padding: "1.6rem 1.8rem",
            borderRadius: 20,
            background: "var(--landing-panel)",
            border: "1px solid var(--landing-border)",
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "var(--landing-text)" }}>
              Pronto para reciclar com impacto?
            </p>
            <p style={{ color: "var(--landing-muted)", fontSize: ".95rem", marginTop: ".3rem" }}>
              Crie sua conta e solicite sua primeira coleta.
            </p>
          </div>
          <TransitionLink
            href="/register"
            style={{
              background: "linear-gradient(135deg, var(--landing-accent), var(--landing-accent-2))",
              color: "#fff",
              fontWeight: 700,
              padding: ".8rem 1.8rem",
              borderRadius: "50px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Criar conta grátis →
          </TransitionLink>
        </div>
      </article>

      <footer
        style={{
          borderTop: "1px solid var(--landing-border)",
          padding: "1.8rem 2.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <TransitionLink href="/" style={{ fontFamily: "var(--font-display)", color: "var(--landing-soft)", fontSize: "1rem", textDecoration: "none" }}>
          ♻ ECOnecta
        </TransitionLink>
        <span style={{ color: "var(--landing-soft)", fontSize: ".8rem" }}>
          Feito com 💚 para um planeta mais sustentável
        </span>
      </footer>
    </main>
  );
}

const paragraph: React.CSSProperties = {
  color: "var(--landing-muted)",
  fontSize: "1rem",
  lineHeight: 1.75,
};

const link: React.CSSProperties = {
  color: "var(--landing-accent)",
  fontWeight: 600,
  textDecoration: "none",
};

const bullet: React.CSSProperties = {
  display: "flex",
  gap: ".8rem",
  alignItems: "flex-start",
};

const itemText: React.CSSProperties = {
  color: "var(--landing-muted)",
  lineHeight: 1.6,
};

const badge: React.CSSProperties = {
  flexShrink: 0,
  fontSize: ".72rem",
  fontWeight: 700,
  padding: ".25rem .7rem",
  borderRadius: "50px",
  textTransform: "uppercase",
  letterSpacing: ".5px",
  marginTop: ".1rem",
  background: "rgba(47,141,71,.14)",
  color: "var(--landing-accent)",
  border: "1px solid rgba(47,141,71,.3)",
  minWidth: 92,
  textAlign: "center",
};

function Section({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: "3rem" }}>
      <p
        style={{
          color: "var(--landing-accent)",
          fontSize: ".75rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1.6px",
          marginBottom: ".5rem",
        }}
      >
        {eyebrow}
      </p>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.5rem, 3vw, 2rem)",
          fontWeight: 700,
          marginBottom: "1rem",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
