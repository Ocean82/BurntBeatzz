"use client"

import { useState } from "react"

interface UploadSongParams {
  file: File
  title: string
  artist: string
  genre: string
  description: string
  includeLicense: boolean
}

export function useSongUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const uploadSong = async (params: UploadSongParams) => {
    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", params.file)
      formData.append("title", params.title)
      formData.append("artist", params.artist)
      formData.append("genre", params.genre)
      formData.append("description", params.description)
      formData.append("includeLicense", params.includeLicense.toString())

      const xhr = new XMLHttpRequest()

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100
          setUploadProgress(progress)
        }
      })

      // Handle completion
      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        })

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed"))
        })
      })

      xhr.open("POST", "/api/songs/upload")
      xhr.send(formData)

      await uploadPromise
      setUploadProgress(100)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
      throw err
    } finally {
      setIsUploading(false)
    }
  }

  return {
    uploadSong,
    isUploading,
    uploadProgress,
    error,
  }
}
