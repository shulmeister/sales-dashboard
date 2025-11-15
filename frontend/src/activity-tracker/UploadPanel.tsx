import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ArticleIcon from "@mui/icons-material/Article";
import ImageIcon from "@mui/icons-material/Image";

const ACCEPTED_TYPES = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".heic",
  ".heif",
];

type UploadResult = {
  success: boolean;
  type?: string;
  filename?: string;
  date?: string;
  total_hours?: number;
  count?: number;
  visits?: Array<Record<string, unknown>>;
  contact?: Record<string, unknown>;
  extracted_text?: string;
  error?: string;
};

type UploadPanelProps = {
  showLegacyLink?: boolean;
};

export const UploadPanel = ({ showLegacyLink = true }: UploadPanelProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileIcon = useMemo(() => {
    if (!file) return null;
    if (file.type.includes("pdf")) {
      return <ArticleIcon sx={{ color: "#38bdf8" }} fontSize="large" />;
    }
    return <ImageIcon sx={{ color: "#f472b6" }} fontSize="large" />;
  }, [file]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Select a PDF or image to upload");
      return;
    }
    setUploading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const payload = (await response.json()) as UploadResult;
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Upload failed");
      }
      setResult(payload);
    } catch (err) {
      console.error("Upload error", err);
      setError(
        err instanceof Error ? err.message : "Something went wrong during upload",
      );
    } finally {
      setUploading(false);
    }
  };

  const openLegacyUploader = () => {
    window.location.assign("/legacy#uploads");
  };

  return (
    <Card sx={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
      {uploading && <LinearProgress color="info" />}
      <CardContent sx={{ p: 3 }}>
        {showLegacyLink && (
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={openLegacyUploader}
              sx={{ textTransform: "none" }}
            >
              Open Legacy Uploader
            </Button>
          </Box>
        )}
        <Box
          sx={{
            border: "1px dashed #475569",
            borderRadius: 2,
            p: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 2,
            backgroundColor: "rgba(148, 163, 184, 0.05)",
          }}
        >
          {fileIcon || <CloudUploadIcon sx={{ fontSize: 48, color: "#64748b" }} />}
          <div>
            <Typography sx={{ fontWeight: 600, color: "#f1f5f9" }}>
              {file ? file.name : "Choose a PDF or image"}
            </Typography>
            <Typography sx={{ color: "#94a3b8", fontSize: "0.85rem" }}>
              Accepted types: {ACCEPTED_TYPES.join(", ")}
            </Typography>
          </div>
          <input
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={handleFileChange}
            disabled={uploading}
          />
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={handleUpload}
            disabled={!file || uploading}
            sx={{
              backgroundColor: "#3b82f6",
              "&:hover": { backgroundColor: "#2563eb" },
              textTransform: "none",
            }}
          >
            {uploading ? "Uploading..." : "Upload & Parse"}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box sx={{ mt: 3 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Successfully processed {result.filename}
            </Alert>
            <Typography sx={{ color: "#e2e8f0", fontWeight: 600 }}>
              Type: {result.type}
            </Typography>
            {result.total_hours != null && (
              <Typography sx={{ color: "#94a3b8" }}>
                Total Hours: {result.total_hours}
              </Typography>
            )}
            {result.count != null && (
              <Typography sx={{ color: "#94a3b8" }}>
                Visits Parsed: {result.count}
              </Typography>
            )}
            {result.contact && (
              <Typography sx={{ color: "#94a3b8" }}>
                Contact: {JSON.stringify(result.contact, null, 2)}
              </Typography>
            )}
            {result.visits && result.visits.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ color: "#e2e8f0", fontWeight: 600 }}>
                  Sample Visits
                </Typography>
                <Typography sx={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                  Showing first 3 entries. Full list available from the Visits tab.
                </Typography>
                <pre
                  style={{
                    background: "#0f172a",
                    padding: "12px",
                    borderRadius: "8px",
                    overflowX: "auto",
                    marginTop: "8px",
                  }}
                >
                  {JSON.stringify(result.visits.slice(0, 3), null, 2)}
                </pre>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default UploadPanel;
