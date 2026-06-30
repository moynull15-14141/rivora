export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        .auth-bg {
          background-image: url('/background/desktop.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        @media (max-width: 640px) {
          .auth-bg {
            background-image: url('/background/mobile.png');
          }
        }
      `}</style>

      <div className="auth-bg relative min-h-screen flex items-center justify-center p-4">
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Content */}
        <div className="relative z-10 w-full flex items-center justify-center">
          {children}
        </div>
      </div>
    </>
  );
}
