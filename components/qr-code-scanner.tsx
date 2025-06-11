"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface QRCodeScannerProps {
  onScan: (data: string) => void
  onClose: () => void
}

export default function QRCodeScanner({ onScan, onClose }: QRCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    let stream: MediaStream | null = null
    let animationFrameId: number

    const startScanner = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
          setIsScanning(true)
          scanQRCode()
        }
      } catch (error) {
        console.error("Error accessing camera:", error)
        toast({
          title: "Camera access error",
          description: "Unable to access your camera. Please check permissions.",
          variant: "destructive",
        })
      }
    }

    const scanQRCode = () => {
      if (!videoRef.current || !canvasRef.current) return

      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext("2d")

      if (!context) return

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight
        canvas.width = video.videoWidth
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        try {
          // In a real app, you would use a QR code scanning library here
          // For this demo, we'll simulate finding a QR code after a few seconds
          setTimeout(() => {
            if (isScanning) {
              const mockProductId = "product-" + Math.floor(Math.random() * 1000)
              onScan(mockProductId)
              stopScanner()
            }
          }, 3000)
        } catch (error) {
          console.error("QR scanning error:", error)
        }
      }

      animationFrameId = requestAnimationFrame(scanQRCode)
    }

    const stopScanner = () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      setIsScanning(false)
    }

    startScanner()

    return () => {
      stopScanner()
    }
  }, [onScan, toast])

  return (
    <div className="relative">
      <div className="relative bg-black rounded-lg overflow-hidden aspect-square max-w-sm mx-auto">
        <video ref={videoRef} className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning overlay */}
        <div className="absolute inset-0 border-2 border-white/30">
          <div className="absolute inset-0 m-8 border-2 border-primary/70 rounded-lg"></div>
          {isScanning && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <Button variant="outline" onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={() => setIsScanning(true)} disabled={isScanning}>
          <Camera className="h-4 w-4 mr-2" />
          {isScanning ? "Scanning..." : "Scan Again"}
        </Button>
      </div>
    </div>
  )
}
