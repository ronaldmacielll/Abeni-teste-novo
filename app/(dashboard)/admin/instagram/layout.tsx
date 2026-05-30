/**
 * Admin Instagram Layout
 * 
 * Layout for Instagram admin interface
 */

export default function AdminInstagramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      {children}
    </div>
  );
}
