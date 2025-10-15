interface ProgressIndicatorProps {
  icon: React.ReactNode;
  text: string;
}

export function ProgressIndicator({ icon, text }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center">
      {icon}
      <span>{text}</span>
    </div>
  );
}