import { useState, useRef, useEffect } from "react";

export default function CameraAccess() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  });

  const requestCameraAccess = async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setHasPermission(true);
      setStream(newStream);
    } catch (error) {
      console.error("Lack of access to the camera:", error);
      setHasPermission(false);
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      const context = canvas.getContext("2d");
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        setCapturedImage(canvas.toDataURL("image/png"));
      }
    }
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
            onLoadedMetadata={() => {
              if (videoRef.current) {
                console.log("Video loaded successfully");
              }
            }}
            onError={(error) => {
              console.error("Error with video element:", error);
            }}
            className="w-full max-w-md rounded-lg shadow-md"
          />
          <button
            onClick={capturePhoto}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg shadow-md"
          >
            Taking pictures 📸
          </button>
        </div>
      ) : (
        <p className="text-red-600">Access to the camera was not granted</p>
      )}

      <canvas ref={canvasRef} className="hidden"></canvas>

      {capturedImage && (
        <div className="mt-4 flex flex-col items-center">
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full max-w-md rounded-lg shadow-md"
          />
          <a
            href={capturedImage}
            download="captured-image.png"
            className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg shadow-md"
          >
            Download photo ⬇️
          </a>
        </div>
      )}
    </div>
  );
}
