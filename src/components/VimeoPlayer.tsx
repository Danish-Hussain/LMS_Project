'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  videoUrl: string;
  sessionId?: string;
  userId?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export default function VimeoPlayer(props: Props) {
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const getVimeoId = (url: string) => {
    const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)?(\d+)/);
    return match ? match[1] : null;
  };

  const getEmbedUrl = (url: string) => {
    const id = getVimeoId(url);
    return id ? `https://player.vimeo.com/video/${id}?controls=true&title=false&byline=false&portrait=false` : url;
  };

  useEffect(() => {
    const id = getVimeoId(props.videoUrl);
    if (!id) {
      setError('Invalid Vimeo URL');
      setDebugInfo(`Could not extract video ID from: ${props.videoUrl}`);
    } else {
      setDebugInfo(`Using Vimeo ID: ${id}`);
    }
  }, [props.videoUrl]);

  return (
    <div className="relative w-full">
      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-md mb-4">
          <p className="font-semibold">{error}</p>
          <p className="text-sm mt-1">{debugInfo}</p>
        </div>
      )}
      
      <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          ref={iframeRef}
          src={getEmbedUrl(props.videoUrl)}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>

      {debugInfo && !error && (
        <div className="mt-2 text-xs text-gray-500">{debugInfo}</div>
      )}
    </div>
  );
}
