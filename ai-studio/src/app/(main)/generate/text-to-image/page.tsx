import { redirect } from "next/navigation";

export default function TextToImageRedirect() {
  redirect("/generate/image?mode=text");
}
