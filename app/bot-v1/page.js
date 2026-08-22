import ChatInterface from "./components/ChatInterface";

export const metadata = {
  title: 'WhatsApp Flow Demo - Classic Rolls',
  description: 'A demo of the WhatsApp flow bot design',
};

export default function BotPage() {
  return (
    <main className="min-h-screen bg-black sm:py-8 sm:px-4 flex items-center justify-center">
      <div className="w-full h-screen sm:h-[850px] sm:max-h-[90vh] sm:rounded-[40px] sm:overflow-hidden sm:shadow-[0_0_50px_rgba(0,0,0,0.5)] sm:border-[8px] sm:border-[#1c1c1c] max-w-md mx-auto bg-black relative">
        <ChatInterface />
      </div>
    </main>
  );
}
