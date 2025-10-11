'use client'

interface CourseThumbnailProps {
  thumbnail: string | null;
  title: string;
  className?: string;
  height?: string;
}

export default function CourseThumbnail({ 
  thumbnail, 
  title, 
  className = "w-full h-48", 
  height = "h-48" 
}: CourseThumbnailProps) {
  return (
    <div className={`relative ${className}`}>
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={title}
          className={`w-full ${height} object-cover`}
          onError={(e) => {
            const target = e.currentTarget;
            const parent = target.parentElement;
            if (parent) {
              target.onerror = null; // Prevent infinite loop
              target.style.display = 'none';
              parent.classList.add('bg-gray-200');
              
              // Create fallback content
              const fallback = document.createElement('div');
              fallback.className = 'absolute inset-0 flex items-center justify-center';
              fallback.innerHTML = `
                <svg class="h-12 w-12 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              `;
              parent.appendChild(fallback);
            }
          }}
        />
      ) : (
        <div className={`w-full ${height} bg-gray-200 flex items-center justify-center`}>
          <svg 
            className="h-12 w-12 text-gray-400" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
            />
          </svg>
        </div>
      )}
    </div>
  )
}