const ALLOWED = ["image/jpeg", "image/png", "image/webp", "video/mp4", "application/pdf"] as const;

export function mediaMimeFromFile(file: { name: string; type: string }): string {
  const declared = file.type.split(";")[0].trim().toLowerCase();
  if (declared === "image/x-png") return "image/png";
  if (declared === "image/jpg" || declared === "image/pjpeg") return "image/jpeg";
  if ((ALLOWED as readonly string[]).includes(declared)) return declared;
  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".mp4")) return "video/mp4";
  return declared || "image/png";
}
