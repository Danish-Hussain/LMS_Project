"use client"

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react'
import VimeoPlayer from './VimeoPlayer'

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
  const containerRef = useRef<HTMLDivElement>(null)
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

  // Vimeo SDK attach helpers
  const vimeoPlayerRef = useRef<any | null>(null)
  const attachAttemptsRef = useRef<number>(0)
  const [externalUsesSdk, setExternalUsesSdk] = useState<boolean | null>(null)
  // debug logging removed for production UI; keep a noop to avoid touching call sites
  const pushDebug = (_msg?: string, _data?: unknown) => {}
  const [attachFailed, setAttachFailed] = useState(false)
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover')

  // pushDebug defined above as noop

  const attachVimeoSdk = async (): Promise<boolean> => {
    try {
      const iframe = containerRef.current?.querySelector('iframe') as HTMLIFrameElement | null
      if (!iframe || !iframe.src) return false
      // already attached?
      if (vimeoPlayerRef.current && vimeoPlayerRef.current.element === iframe) return true
      attachAttemptsRef.current += 1
      const mod = await import('@vimeo/player')
      const Player = (mod as any).default ?? mod
      vimeoPlayerRef.current = new Player(iframe)
      setExternalUsesSdk(true)
      // Ensure parent controller doesn't try to control playback once SDK is attached
      setIsPlaying(false)
  // vimeo attached
      setAttachFailed(false)
      vimeoPlayerRef.current.on?.('play', () => setIsPlaying(true))
      vimeoPlayerRef.current.on?.('pause', () => setIsPlaying(false))
      return true
    } catch (err) {
  // attachVimeoSdk failed
      attachAttemptsRef.current += 1
      if (attachAttemptsRef.current >= 3) setAttachFailed(true)
      return false
    }
  }
  // ReactPlayer removed; no RP alias

  const handleEnded = () => {
    setIsPlaying(false)
    
    // Mark the session as completed (no longer sending watchedTime)
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        completed: true
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

  const isVimeo = (url: string) => {
    if (!url) return false
    return /vimeo\.com/.test(url)
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

  // Try to auto-attach Vimeo SDK when using a Vimeo embed and when internal player is available
  useEffect(() => {
    let mounted = true
    const tryAttach = async () => {
      if (!mounted) return
      if (!isExternalProvider(videoUrl)) return
      // only attempt attach for vimeo urls
      if (!/vimeo\.com/.test(videoUrl)) return

      // If the iframe already exposes an API (unlikely) we would skip SDK attach; otherwise continue

      // attempt attach with a few retries
      for (let i = 0; i < 3; i++) {
        const ok = await attachVimeoSdk()
        if (ok) return
        await new Promise((r) => setTimeout(r, 500 * (i + 1)))
      }
    }

    tryAttach()
    return () => { mounted = false }
  }, [videoUrl])

  const togglePlay = () => {
    // For react-player, control playing via state
  if (isExternalProvider(videoUrl)) {
      // prevent rapid toggles that may confuse the underlying provider
      const now = Date.now()
      if (now - lastExternalToggleRef.current < 300) return
      lastExternalToggleRef.current = now

      // If we have a Vimeo SDK attached prefer to call its play/pause directly
  if (vimeoPlayerRef.current) {
        try {
          if (isPlaying) {
            // vimeo sdk: pause()
            vimeoPlayerRef.current.pause?.()
            setIsPlaying(false)
          } else {
            // vimeo sdk: play() (optimistic)
            // optimistic update: set playing immediately so ReactPlayer won't force a pause
            setIsPlaying(true)
            try {
              const p = vimeoPlayerRef.current.play?.()
              if (p && typeof p.then === 'function') {
                playPromiseRef.current = p
                p.then(() => {
                  playPromiseRef.current = null
                  // vimeo sdk: play resolved
                }).catch((err: any) => {
                  playPromiseRef.current = null
                  // vimeo sdk: play failed
                  // revert optimistic state on failure
                  setIsPlaying(false)
                })
              }
            } catch (err) {
              // vimeo sdk: play threw
              setIsPlaying(false)
            }
          }
        } catch (err) {
          // vimeo sdk toggle error
        }
        return
      }

      // Otherwise we toggle isPlaying state heuristically (iframe without SDK)
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

  const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = (parseFloat(e.target.value) / 100) * duration
    if (isExternalProvider(videoUrl)) {
      try {
        if (vimeoPlayerRef.current && typeof vimeoPlayerRef.current.setCurrentTime === 'function') {
          await vimeoPlayerRef.current.setCurrentTime(seekTime)
        }
      } catch (err) { /* ignore */ }
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
      // Try to request fullscreen on the iframe element
      try {
        const iframe = containerRef.current?.querySelector('iframe') as HTMLElement | null
        if (iframe && (iframe as any).requestFullscreen) {
          ;(iframe as any).requestFullscreen()
          return
        }
        // fallback: try the container
        if (containerRef.current && containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen()
          return
        }
      } catch (err) {
        // ignore
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
    <div className="w-full bg-white rounded-lg overflow-hidden">
      <div className="relative">
        {/* Debug toolbar removed - streamlined Vimeo-only playback UI */}

  {externalProvider ? (
          // Use the simple VimeoPlayer iframe for Vimeo URLs to avoid ReactPlayer<->iframe race
          // If it's a Vimeo URL, render VimeoPlayer, otherwise fall back to ReactPlayer for other providers
          /vimeo\.com/.test(videoUrl) ? (
      <div className="relative w-full bg-transparent">
    <div className={`w-full aspect-video overflow-hidden rounded-t-lg bg-white`}>
                <VimeoPlayer
                  videoUrl={videoUrl}
                  sessionId={sessionId}
                  userId={userId}
                  onProgress={(playedSeconds) => {
                    // The simple VimeoPlayer currently doesn't report progress; keep stub in case it's added later
                    if (onProgressUpdate) onProgressUpdate(playedSeconds)
                  }}
                  onComplete={(sid) => { if (onComplete) onComplete(sid) }}
                />
              </div>
            </div>
          ) : (
              <div className="relative w-full bg-transparent">
              <div className={`w-full aspect-video overflow-hidden rounded-t-lg bg-white`}>
                <div className="w-full h-full">
                  <iframe
                    src={getVimeoEmbedUrl(videoUrl) + '?title=false&byline=false&portrait=false&controls=1'}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    style={{ width: '100%', height: '100%', border: 0 }}
                  />
                </div>
              </div>
            </div>
          )
          ) : (
          <div className={`w-full aspect-video overflow-hidden rounded-t-lg bg-white`}>
            <video ref={videoRef} src={videoUrl} className={`w-full h-full ${fitMode === 'cover' ? 'object-cover' : 'object-contain'}`} preload="metadata" />
          </div>
        )}

        {attachFailed && (
          <div className="p-3 bg-yellow-50 text-yellow-900 rounded-md mt-3">
            <div className="flex items-center justify-between">
              <div>
                <strong>Video playback is restricted.</strong>
                <div className="text-xs mt-1">This Vimeo video may be private or block programmatic playback. You can open it directly on Vimeo.</div>
              </div>
              <div className="flex items-center gap-2">
                <a href={getVimeoEmbedUrl(videoUrl)} target="_blank" rel="noreferrer" className="underline text-yellow-800">Open in Vimeo</a>
                <button className="btn" onClick={async () => { attachAttemptsRef.current = 0; setAttachFailed(false); const ok = await attachVimeoSdk(); }}>Retry</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Play/Pause Overlay (hidden for Vimeo-only) */}
        {!isVimeo(videoUrl) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="text-white p-4 rounded-full transition-all"
            >
              {isPlaying ? (
                <Pause className="h-12 w-12" />
              ) : (
                <Play className="h-12 w-12" />
              )}
            </button>
          </div>
        )}
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

      {/* Controls (hide when Vimeo-only) */}
      {!isVimeo(videoUrl) && (
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
              onClick={() => setFitMode((m) => (m === 'cover' ? 'contain' : 'cover'))}
              className="hover:text-blue-400 transition-colors"
              title={fitMode === 'cover' ? 'Show full video (contain)' : 'Crop video to fill (cover)'}
            >
              <span className="text-xs">{fitMode === 'cover' ? 'Crop' : 'Fit'}</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="hover:text-blue-400 transition-colors"
            >
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
        </div>
      )}

  {/* Session documents removed per request */}

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
