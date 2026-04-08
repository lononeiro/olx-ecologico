import { NextRequest, NextResponse } from "next/server";
import { formatCep, normalizeCep } from "@/lib/address";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { cep: string } }
) {
  const cep = normalizeCep(params.cep);

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
      complemento: data.complemento ?? "",
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível consultar o CEP agora." },
      { status: 500 }
    );
  }
}
