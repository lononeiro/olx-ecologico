import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};
const CLOUD_NAME = String(extra.cloudinaryCloudName ?? "");
const UPLOAD_PRESET = String(extra.cloudinaryUploadPreset ?? "");

export class CloudinaryUploadError extends Error {}

export type CloudinaryUploadInput = {
  uri: string;
  base64?: string | null;
  mimeType?: string | null;
  fileName?: string | null;
};

function guessFileName(uri: string) {
  const last = uri.split("/").pop() ?? "foto.jpg";
  return last.includes(".") ? last : `${last}.jpg`;
}

function guessMimeType(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic" || ext === "heif") return "image/heic";
  return "image/jpeg";
}

export async function uploadImageToCloudinary(
  asset: CloudinaryUploadInput
): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new CloudinaryUploadError("Upload de imagens não está configurado.");
  }

  if (!asset.base64) {
    throw new CloudinaryUploadError(
      "Não foi possível ler a imagem selecionada. Tente novamente."
    );
  }

  const fileName = asset.fileName || guessFileName(asset.uri);
  const mimeType = asset.mimeType || guessMimeType(fileName);

  // O fetch do Expo (WinterCG) não suporta o formato { uri, name, type } do
  // React Native — ele lança "Unsupported FormDataPart implementation". O
  // Cloudinary, por sua vez, aceita o campo `file` como data URI base64, que é
  // uma string e portanto suportada. Não defina "Content-Type" manualmente: o
  // fetch monta o header com o boundary do multipart.
  const formData = new FormData();
  formData.append("file", `data:${mimeType};base64,${asset.base64}`);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok || typeof data?.secure_url !== "string") {
    const reason = data?.error?.message ?? "Não foi possível enviar a imagem.";
    throw new CloudinaryUploadError(reason);
  }

  return data.secure_url as string;
}
