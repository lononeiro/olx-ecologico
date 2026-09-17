import { NextRequest, NextResponse } from "next/server";
import { formatCep, normalizeCep } from "@/lib/address";

export const dynamic = "force-dynamic";

/**
 * Em CEPs de logradouro extenso, o ViaCEP devolve em "complemento" a faixa de
 * numeração coberta por aquele CEP (ex.: "até 621 - lado ímpar", "de 1000/1001
 * a 1998/1999") — não é o complemento do imóvel (apto, bloco etc.). Se isso cai
 * direto no formulário, o endereço final vira algo como "..., 221, até 621 -
 * lado ímpar, ...", que confunde geocodificadores e o Google Maps. Descarta
 * esse texto informativo em vez de tratá-lo como complemento de verdade.
 */
function limparComplementoDeFaixa(complemento?: string) {
  const valor = complemento?.trim() ?? "";
  if (!valor) return "";
  if (/\bat[ée]\b|\blado\s+(ímpar|par)\b|\bde\s+\d+.*\ba\s+\d+/i.test(valor)) return "";
  return valor;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ cep: string }> }
) {
  const cep = normalizeCep((await params).cep);

  if (cep.length !== 8) {
    return NextResponse.json({ error: "CEP inválido." }, { status: 400 });
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Não foi possível consultar o CEP agora." },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (data?.erro) {
      return NextResponse.json({ error: "CEP não encontrado." }, { status: 404 });
    }

    return NextResponse.json({
      cep: formatCep(data.cep ?? cep),
      rua: data.logradouro ?? "",
      bairro: data.bairro ?? "",
      cidade: data.localidade ?? "",
      uf: data.uf ?? "",
      complemento: limparComplementoDeFaixa(data.complemento),
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível consultar o CEP agora." },
      { status: 500 }
    );
  }
}
