export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="border border-[#7f1d1d] bg-[#190d0d] px-4 py-3 text-sm text-[#fecaca]">
      {message}
    </div>
  );
}
