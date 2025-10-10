"use client"

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

// Dynamic import with loading state
const ReactPlayer = dynamic(() => import('react-player'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video bg-gray-900 animate-pulse flex items-center justify-center">
      <div className="text-gray-500">Loading player...</div>
    </div>
  ),
}) as any  // Type assertion needed for dynamic import

interface VimeoPlayerProps {
  videoUrl: string
  sessionId?: string
  userId?: string
  onProgress?: (progress: number) => void
  onComplete?: () => void
}

// Helper function to extract Vimeo ID from URL
function extractVimeoId(url: string): string | null {
  const patterns = [
    /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)?(\d+)/,
    /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)/,
    /vimeo\.com\/event\/(\d+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1] || match[2]
    }
  }
  return null
}

export default function VimeoPlayer({
  videoUrl,
  sessionId,
  userId,
  onProgress,
  onComplete,
}: VimeoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [isReady, setIsReady] = useState(false)
  const playerRef = useRef<any>(null)

  // Validate video URL on mount
  useEffect(() => {
    const vimeoId = extractVimeoId(videoUrl)
    if (!vimeoId) {
      setError('Invalid Vimeo URL format')
      setDebugInfo(`Invalid URL provided: ${videoUrl}`)
      return
    }

    // Convert to embed URL if needed
    if (!videoUrl.includes('player.vimeo.com')) {
      setDebugInfo(`Using Vimeo ID: ${vimeoId}`)
    }
  }, [videoUrl])

  const handleError = (err: unknown) => {
    console.error('Vimeo player error:', err)
    setError('Failed to load video. Please check the URL and try again.')
    setDebugInfo(`Error details: ${err instanceof Error ? err.message : String(err)}`)
  }

  // Save progress to server if sessionId is provided
  const saveProgress = async (progress: number, completed = false) => {
    if (!sessionId || !userId) return

    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId,
          watchedTime: Math.floor(progress),
          completed
        })
      })
    } catch (err) {
      console.error('Failed to save progress:', err)
    }
  }

  return (
    <div className="relative w-full">
      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-md mb-4">
          <p className="font-semibold mb-2">Error Loading Video</p>
          <p className="text-sm mb-2">{error}</p>
          {debugInfo && (
            <p className="text-xs opacity-75 mb-2">{debugInfo}</p>
          )}
          <div className="flex items-center gap-4">
            <a 
              href={videoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-red-600 hover:text-red-800 underline text-sm"
            >
              Open in new tab
            </a>
            <button
              onClick={() => {
                setError(null)
                setDebugInfo("")
              }}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Player */}
      <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
        <ReactPlayer
          ref={playerRef}
          url={videoUrl}
          width="100%"
          height="100%"
          playing={isPlaying}
          controls={true}
          config={{
            vimeo: {
              playerOptions: {
                byline: false,
                portrait: false,
                title: false,
                responsive: true,
                dnt: true
              }
            }
          }}
          onReady={() => {
            setIsReady(true)
            setDebugInfo(`Player ready: ${videoUrl}`)
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => {
            setIsPlaying(false)
            // Save progress on pause if we have sessionId
            if (playerRef.current) {
              const currentTime = playerRef.current.getCurrentTime()
              saveProgress(currentTime)
            }
          }}
          onError={handleError}
          onProgress={(state: any) => {
            if (onProgress && typeof state.played === 'number') {
              onProgress(state.played)
            }
            // Save progress periodically
            if (sessionId && state.playedSeconds && Math.floor(state.playedSeconds) % 10 === 0) {
              saveProgress(state.playedSeconds)
            }
          }}
          onEnded={() => {
            setIsPlaying(false)
            if (onComplete) onComplete()
            // Mark as completed
            if (playerRef.current) {
              const duration = playerRef.current.getDuration()
              saveProgress(duration, true)
            }
          }}
        />
      </div>

      {/* Debug info */}
      {debugInfo && !error && (
        <div className="mt-2 text-xs text-gray-500">
          {debugInfo}
        </div>
      )}
    </div>
  )
}