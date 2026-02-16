import { useState } from 'react';
import { uploadFileToR2 } from '../lib/r2Storage';
import { modelsService } from '../lib/modelsService'; // Using existing service for DB operations if desired
import { supabase } from '../lib/supabase'; // Or direct Supabase
import { Upload, X, Check, Loader2 } from 'lucide-react';

const FileUploader = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);
      setError(null);
      
      // 1. Upload to Cloudflare R2
      const url = await uploadFileToR2(file, 'models'); 
      console.log("File uploaded to:", url);
      setMediaUrl(url);

      // 2. Save URL and metadata to Supabase 'media_assets' table
      const fileName = file.name;
      const fileType = file.type;
      const fileSize = file.size;

      const { data: dbData, error: dbError } = await supabase
        .from('media_assets')
        .insert([
          { 
            file_name: fileName,
            file_url: url,
            file_type: fileType,
            file_size: fileSize,
            bucket_path: 'models' // folder name
          }
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      if (onUploadSuccess) {
        onUploadSuccess(url, dbData);
      }

      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 border border-white/10 rounded-xl bg-black/50 backdrop-blur-md hover:border-white/20 transition-all text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gold-accent flex items-center gap-2">
          <Upload className="w-4 h-4" />
          R2 Cloud Upload (10GB Limit)
        </h3>
      </div>
      
      <div className="relative group/upload cursor-pointer border-2 border-dashed border-white/10 hover:border-gold-accent/50 rounded-lg p-8 transition-all flex flex-col items-center justify-center gap-2">
        <input 
          type="file" 
          accept="image/*,video/*" 
          onChange={handleFileChange} 
          disabled={uploading}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />
        
        {uploading ? (
          <div className="flex flex-col items-center text-white/40 animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-gold-accent" />
            <p className="text-xs uppercase tracking-widest">Uploading to Cloudflare...</p>
          </div>
        ) : mediaUrl ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
              <Check className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-xs text-white/60">Upload Complete</p>
            <p className="text-[10px] text-white/30 break-all max-w-[200px] text-center mt-1">{mediaUrl}</p>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-white/5 group-hover/upload:bg-gold-accent/10 flex items-center justify-center transition-colors mb-2">
              <Upload className="w-5 h-5 text-white/40 group-hover/upload:text-gold-accent transition-colors" />
            </div>
            <p className="text-xs font-bold text-white/60 group-hover/upload:text-white transition-colors">Click or Drag to Upload</p>
            <p className="text-[10px] text-white/30">JPG, PNG, WEBM, MP4</p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400 flex items-center gap-2">
          <X className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
