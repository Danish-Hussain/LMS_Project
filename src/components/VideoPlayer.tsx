"use client"

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react'
import ReactPlayer from 'react-player'
import { DocumentList } from './DocumentList'

interface VideoPlayerProps {
  videoUrl: string
  sessionId: string
  userId: string
  isInstructor?: boolean
  onProgressUpdate?: (progress: number) => void
  onComplete?: (sessionId: string) => void
  progressThrottleMs?: number
  completionThreshold?: number // fraction e.g. 0.9 for 90%
  schedulePauseOnPendingPlay?: boolean
  playbackDebug?: boolean
}

export default function VideoPlayer({ 
  videoUrl, 
  sessionId, 
  userId,
  isInstructor = false,
  onProgressUpdate,
  onComplete,
  progressThrottleMs = 3000,
  completionThreshold = 0.9,
  schedulePauseOnPendingPlay = true,
  playbackDebug = false
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<any>(null)
  const lastSentRef = useRef<number>(0)
  const completedSentRef = useRef<boolean>(false)
  // Use ReactPlayer directly
  // helper: detect external provider early so we can set initial loading state
  const externalProvider = /vimeo\.com|youtube\.com|youtu\.be|dailymotion\.com/.test(videoUrl)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  // For external providers (Vimeo/YouTube) we should mount ReactPlayer immediately
  const [isLoading, setIsLoading] = useState(() => (externalProvider ? false : true))
  const [loadError, setLoadError] = useState<string | null>(null)
  const playPromiseRef = useRef<Promise<void> | null>(null)
  const lastExternalToggleRef = useRef<number>(0)

  const handleEnded = () => {
    setIsPlaying(false)
    
    // Mark the session as completed
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        completed: true,
        watchedTime: currentTime
      })
    }).catch(console.error)

    if (onComplete) {
      onComplete(sessionId)
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setIsLoading(false)
    }

    const handleVideoError = (ev: any) => {
      console.error('HTML5 video error:', ev)
      setLoadError('Failed to load video. You can open the raw URL in a new tab to test.')
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      const current = video.currentTime
      const total = video.duration
      setCurrentTime(current)
      setProgress((current / total) * 100)
      
      // Update progress in database
      updateProgress(current)
      
      if (onProgressUpdate) {
        onProgressUpdate(current)
      }
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleVideoError)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleVideoError)
    }
  }, [sessionId, currentTime, onProgressUpdate, onComplete])

  // helpers to detect if the URL is a direct file or an external provider (Vimeo/YouTube)
  const isExternalProvider = (url: string) => {
    if (!url) return false
    // react-player supports many providers (vimeo, youtube, etc.)
    return /vimeo\.com|youtube\.com|youtu\.be|dailymotion\.com/.test(url)
  }

  const getVimeoId = (url: string): string | null => {
    const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)?(\d+)/)
    return match ? match[1] : null
  }

  const getVimeoEmbedUrl = (url: string): string => {
    const id = getVimeoId(url)
    return id ? `https://player.vimeo.com/video/${id}` : url
  }

  const updateProgress = async (watchedTime: number) => {
    try {
      const now = Date.now()
      const isComplete = typeof duration === 'number' && watchedTime >= duration * completionThreshold

      // Throttle non-completion updates to once every `progressThrottleMs`.
      if (!isComplete && now - lastSentRef.current < progressThrottleMs) {
        return
      }

      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          userId,
          watchedTime: Math.floor(watchedTime),
          completed: isComplete
        })
      })

      if (!res.ok) {
        // don't treat as fatal, but log
        console.error('Progress update failed', await res.text())
      } else {
        lastSentRef.current = now
      }

      // If we've crossed the completion threshold, ensure we only notify once
      if (isComplete && !completedSentRef.current) {
        completedSentRef.current = true
        if (onComplete) onComplete(sessionId)
      }
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  useEffect(() => {
    // reset throttle/completion when session changes
    lastSentRef.current = 0
    completedSentRef.current = false
  }, [sessionId])

  const togglePlay = () => {
    // For react-player, control playing via state
    if (isExternalProvider(videoUrl)) {
      // prevent rapid toggles that may confuse the underlying provider
      const now = Date.now()
      if (now - lastExternalToggleRef.current < 300) return
      lastExternalToggleRef.current = now
      setIsPlaying((p) => !p)
      return
    }

    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      // Try to pause. If a play() promise is pending, schedule pause after it resolves.
      try {
        if (schedulePauseOnPendingPlay && playPromiseRef.current) {
          const v = video
          if (playbackDebug) console.debug('Scheduling pause after pending play() resolves')
          playPromiseRef.current.then(() => {
            try {
              if (v === videoRef.current) v.pause()
            } catch (err) { /* ignore */ }
          }).catch(() => {})
        } else {
          video.pause()
        }
      } catch (err) {
        console.error('Error pausing video:', err)
      }
      setIsPlaying(false)
    } else {
      // Avoid calling play if it's already playing
      if (!video.paused) {
        setIsPlaying(true)
        return
      }

      try {
        const playPromise = video.play()
        if (playPromise !== undefined) {
          playPromiseRef.current = playPromise as Promise<void>
          if (playbackDebug) console.debug('play() promise created')
          playPromiseRef.current
            .then(() => {
              setIsPlaying(true)
              playPromiseRef.current = null
              if (playbackDebug) console.debug('play() promise resolved')
            })
            .catch((err: any) => {
              if (err && err.name === 'AbortError') return
              console.error('Play failed:', err)
              playPromiseRef.current = null
            })
        } else {
          setIsPlaying(true)
        }
      } catch (err) {
        console.error('Play failed:', err)
      }
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = (parseFloat(e.target.value) / 100) * duration
    if (isExternalProvider(videoUrl)) {
      // react-player's seekTo accepts seconds
      try {
        playerRef.current?.seekTo?.(seekTime, 'seconds')
      } catch (err) {
        // fallback: nothing
      }
      setCurrentTime(seekTime)
      return
    }

    const video = videoRef.current
    if (!video) return

    video.currentTime = seekTime
    setCurrentTime(seekTime)
  }

  const toggleMute = () => {
    if (isExternalProvider(videoUrl)) {
      setIsMuted((m) => !m)
      return
    }

    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      video.volume = volume
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (isExternalProvider(videoUrl)) {
      // ReactPlayer accepts volume/muted props; update state and let it reflect
      if (newVolume === 0) {
        setIsMuted(true)
      } else {
        setIsMuted(false)
      }
      return
    }

    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
    if (newVolume === 0) {
      setIsMuted(true)
    } else {
      setIsMuted(false)
    }
  }

  const toggleFullscreen = () => {
    if (isExternalProvider(videoUrl)) {
      // Try to request fullscreen on the internal player element
      const internal = playerRef.current?.getInternalPlayer?.()
      try {
        if (internal && internal.requestFullscreen) {
          internal.requestFullscreen()
          return
        }
        // Some providers expose a DOM node (e.g., iframe)
        const el = playerRef.current?.getInternalPlayer?.()?.iframe || playerRef.current?.getInternalPlayer?.()
        if (el && el.requestFullscreen) {
          el.requestFullscreen()
          return
        }
      } catch (err) {
        // fallback to nothing
      }

      return
    }

    const video = videoRef.current
    if (!video) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      video.requestFullscreen()
    }
  }

  const resetProgress = () => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = 0
    setCurrentTime(0)
    setProgress(0)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="w-full h-96 bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden">
      <div className="relative">
          {isExternalProvider(videoUrl) ? (
          <div className="w-full h-auto">
            {
              // Build props then spread as any to avoid TF type mismatch in this project
              (() => {
                const rp: any = {
                  url: getVimeoEmbedUrl(videoUrl),
                  ref: playerRef,
                  playing: isPlaying,
                  width: '100%',
                  height: '100%',
                  config: {
                    vimeo: {
                      playerOptions: {
                        responsive: true,
                        autopause: false,
                        autoplay: false,
                        byline: false,
                        portrait: false,
                        title: false,
                        transparent: false,
                        controls: true
                      },
                      iframeParams: { allow: 'autoplay; fullscreen; picture-in-picture' }
                    }
                  },
                  onProgress: (state: any) => {
                    const playedSeconds = (state.playedSeconds ?? state.played) || 0
                    setCurrentTime(playedSeconds)
                    if (duration > 0) setProgress((playedSeconds / duration) * 100)
                    updateProgress(playedSeconds)
                    if (onProgressUpdate) onProgressUpdate(playedSeconds)
                  },
                  onReady: () => {
                    try {
                      const internal = playerRef.current?.getInternalPlayer?.()
                      const d = playerRef.current?.getDuration?.() || (internal && internal.getDuration ? internal.getDuration() : undefined)
                      if (typeof d === 'number' && !isNaN(d)) setDuration(d)
                    } catch (err) { /* ignore */ }
                    setIsLoading(false)
                  },
                  onEnded: () => {
                    setIsPlaying(false)
                    if (onComplete) onComplete(sessionId)
                  },
                  onError: (err: any) => {
                    console.error('ReactPlayer load error:', err)
                    setLoadError(typeof err === 'string' ? err : JSON.stringify(err))
                  }
                }
                return <ReactPlayer {...rp} />
              })()
            }
          </div>
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-auto"
            preload="metadata"
          />
        )}
        
        {/* Play/Pause Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-4 rounded-full transition-all"
          >
            {isPlaying ? (
              <Pause className="h-12 w-12" />
            ) : (
              <Play className="h-12 w-12" />
            )}
          </button>
        </div>
      </div>

      {loadError && (
        <div className="p-3 bg-red-50 text-red-800 rounded-md mb-3">
          <div className="flex items-center justify-between">
            <div>
              <strong>Player failed to load.</strong>
              <div className="text-xs text-red-700 mt-1">{loadError}</div>
            </div>
            <div>
              <a href={videoUrl} target="_blank" rel="noreferrer" className="underline text-red-700">
                Open raw URL
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-gray-900 text-white p-4">
        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlay}
              className="hover:text-blue-400 transition-colors"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </button>

            <button
              onClick={resetProgress}
              className="hover:text-blue-400 transition-colors"
              title="Restart"
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="hover:text-blue-400 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            
            <button
              onClick={toggleFullscreen}
              className="hover:text-blue-400 transition-colors"
            >
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <DocumentList sessionId={sessionId} isInstructor={isInstructor} />

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}
