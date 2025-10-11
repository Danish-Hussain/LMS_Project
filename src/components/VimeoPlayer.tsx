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
    }
  }, [props.videoUrl]);

  return (
    <div className="relative w-full">
      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-md mb-4">
          <p className="font-semibold">{error}</p>
        </div>
      )}
      
      <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          ref={iframeRef}
          width="100%"
          height="100%"
          src={getEmbedUrl(props.videoUrl)}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}
