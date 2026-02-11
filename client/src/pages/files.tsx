import { useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, File, Trash2, Download, Image } from "lucide-react";
import type { FileUpload } from "@shared/schema";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <Image className="w-5 h-5 text-chart-5" />;
  if (mimeType === "application/pdf") return <FileText className="w-5 h-5 text-destructive" />;
  return <File className="w-5 h-5 text-chart-1" />;
}

export default function FilesPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: files, isLoading } = useQuery<FileUpload[]>({
    queryKey: ["/api/files"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setUploading(true);
      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({ title: "File uploaded successfully" });
      setUploading(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
      setUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/files/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({ title: "File deleted" });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    Array.from(selectedFiles).forEach((file) => {
      const formData = new FormData();
      formData.append("file", file);
      uploadMutation.mutate(formData);
    });
    e.target.value = "";
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-files-title">Files & Notes</h1>
          <p className="text-muted-foreground mt-1">{files?.length || 0} files uploaded</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2" data-testid="button-upload-file">
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading..." : "Upload File"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.md"
          onChange={handleFileSelect}
          data-testid="input-file-upload"
        />
      </div>

      {(!files || files.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No files yet</h3>
            <p className="text-muted-foreground text-sm text-center max-w-sm mb-6">
              Upload your study notes, PDFs, and other materials to keep them organized.
            </p>
            <Button onClick={() => fileInputRef.current?.click()} className="gap-2" data-testid="button-upload-first">
              <Upload className="w-4 h-4" />
              Upload Your First File
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <Card key={file.id} className="hover-elevate" data-testid={`card-file-${file.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted flex-shrink-0">
                    {getFileIcon(file.mimeType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.originalName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatFileSize(file.size)} &middot; {new Date(file.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1 mt-3">
                  <a href={`/api/files/${file.id}/download`} download>
                    <Button size="icon" variant="ghost" data-testid={`button-download-${file.id}`}>
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(file.id)}
                    data-testid={`button-delete-file-${file.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
