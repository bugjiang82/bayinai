import { saveToStorage, loadFromStorage } from "@/lib/imageStorage";

const STORAGE_KEY = "unified-image-reference-images";

const [referenceImages, setReferenceImages] = useState<string[]>([]);

useEffect(() => {
  loadFromStorage(STORAGE_KEY).then(setReferenceImages);
}, []);

useEffect(() => {
  saveToStorage(referenceImages, STORAGE_KEY);
}, [referenceImages]);

const handleFileUpload = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string;
    setReferenceImages((prev) => [...prev, dataUrl]);
  };
  reader.readAsDataURL(file);
};
