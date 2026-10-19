// 휴대폰 사진은 수 MB라서 업로드 전에 긴 변 1600px JPEG로 줄인다. (글자 판독에는 충분)
export async function resizeImage(file: File, maxSide = 1600): Promise<{ mediaType: "image/jpeg"; data: string; preview: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return { mediaType: "image/jpeg", data: dataUrl.split(",")[1], preview: dataUrl };
}
