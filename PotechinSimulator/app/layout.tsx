import './globals.css';

export const metadata = {
  title: 'Potechin Branching Program Simulator',
  description: 'Interactive n=2 simulation of Potechin\'s amortized branching-program construction.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
