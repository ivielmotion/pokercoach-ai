// Componente genérico para subir archivos
import { useRef, useState } from 'react';
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FileUploaderProps {
  accept: string;
  onFileLoaded: (content: string, fileName: string) => void;
  label?: string;
  description?: string;
}

export function FileUploader({ accept, onFileLoaded, label = 'Cargar Archivo', description }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess(false);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onFileLoaded(content, file.name);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    };
    reader.onerror = () => {
      setError('Error al leer el archivo');
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    setFileName(null);
    setError('');
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all",
            "bg-accent-green/10 text-accent-green hover:bg-accent-green/20 border border-accent-green/20"
          )}
        >
          <Upload className="w-4 h-4" />
          {label}
        </button>
        
        {fileName && (
          <div className="flex items-center gap-2 text-xs">
            <FileText className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-text-secondary truncate max-w-[200px]">{fileName}</span>
            <button
              onClick={handleReset}
              className="text-text-muted hover:text-accent-red"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {description && (
        <p className="text-xs text-text-muted">{description}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <div className="flex items-center gap-2 text-xs text-accent-red">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-xs text-accent-green">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Archivo cargado correctamente
        </div>
      )}
    </div>
  );
}
