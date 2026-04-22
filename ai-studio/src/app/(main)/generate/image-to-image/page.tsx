import { redirect } from "next/navigation";

export default function ImageToImageRedirect() {
  redirect("/generate/image?mode=image");
}
