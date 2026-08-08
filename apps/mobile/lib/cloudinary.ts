import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};
const CLOUD_NAME = String(extra.cloudinaryCloudName ?? "");
const UPLOAD_PRESET = String(extra.cloudinaryUploadPreset ?? "");

export class CloudinaryUploadError extends Error {}

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

export async function uploadImageToCloudinary(localUri: string): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new CloudinaryUploadError("Upload de imagens não está configurado.");
  }

  const fileName = guessFileName(localUri);
  const formData = new FormData();
  formData.append("file", {
    uri: localUri,
    name: fileName,
    type: guessMimeType(fileName),
  } as unknown as Blob);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok || typeof data?.secure_url !== "string") {
    const reason = data?.error?.message ?? "Não foi possível enviar a imagem.";
    throw new CloudinaryUploadError(reason);
  }

  return data.secure_url as string;
}
