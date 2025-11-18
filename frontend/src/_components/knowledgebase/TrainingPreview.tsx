// import React from "react";
// import { Play } from "lucide-react";

// const conversation = [
//   { id: 1, sender: "user", text: "Hi, can you help me with my order?" },
//   { id: 2, sender: "agent", text: "Of course! Can you share your order ID?" },
//   { id: 3, sender: "user", text: "Yes, it’s #12345." },
//   {
//     id: 4,
//     sender: "agent",
//     text: "Thanks! Your order is on the way and should arrive tomorrow.",
//   },
//   { id: 5, sender: "user", text: "Perfect, thank you!" },
//   { id: 6, sender: "agent", text: "You’re welcome! 😊" },
// ];

// const TrainingPreview = () => {
//   const ProgressBar = ({ step, total }: { step: number; total: number }) => (
//     <div className="flex items-center gap-3">
//       {/* Progress bar */}
//       <div className="w-10 lg:w-20 rounded-full bg-gray-600 h-2 overflow-hidden">
//         <div
//           className="bg-[#ef3e6d] h-2 rounded-full transition-all duration-500 ease-in-out"
//           style={{ width: `${(step / total) * 100}%` }}
//         />
//       </div>
//       {/* Percentage */}
//       <span className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">
//         {Math.round((step / total) * 100)}%
//       </span>
//     </div>
//   );

//   return (
//     <div className="w-full mx-auto p-4 sm:p-6 lg:p-8 bg-[#171717] rounded-2xl border border-gray-700 shadow-md mt-8">
//       {/* Header row */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//         <h3 className="text-white text-lg font-semibold leading-tight">
//           Training Preview
//         </h3>

//         <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#262626] text-gray-200 text-sm font-medium rounded-lg hover:bg-[#333] transition w-full sm:w-auto">
//           <Play className="w-4 h-4" />
//           Start Training
//         </button>
//       </div>

//       {/* Main content grid */}
//       <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 mt-8">
//         {/* Left panel */}
//         <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#171717] rounded-2xl border border-gray-700 shadow-md">
//           <h3 className="text-white text-lg font-semibold leading-tight mb-4">
//             Sample Conversation
//           </h3>

//           <div className="space-y-4">
//             {conversation.map((msg) => (
//               <div
//                 key={msg.id}
//                 className={`flex ${
//                   msg.sender === "user" ? "justify-end" : "justify-start"
//                 }`}
//               >
//                 <div
//                   className={`max-w-xs sm:max-w-sm md:max-w-md px-4 py-2 rounded-xl text-sm ${
//                     msg.sender === "user"
//                       ? "bg-[#ef3e6d] text-white rounded-br-none"
//                       : "bg-[#262626] text-gray-200 rounded-bl-none"
//                   }`}
//                 >
//                   {msg.text}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Right panel */}
//         <div className="flex-1 flex flex-col gap-6">
//           {/* Knowledge Sources */}
//           <div className="p-4 sm:p-6 lg:p-8 bg-[#171717] rounded-2xl border border-gray-700 shadow-md">
//             <h3 className="text-white text-lg font-semibold leading-tight">
//               Knowledge Sources
//             </h3>
//             <div className="mt-5 space-y-3 text-sm sm:text-base text-gray-300">
//               {[
//                 { title: "Product Manual v2.1.pdf", status: "Active" },
//                 { title: "Customer Guidelines.docx", status: "Active" },
//                 { title: "FAQ Database.txt", status: "Active" },
//                 { title: "Auto-Generated FAQs", status: "156 items" },
//               ].map((item, idx) => (
//                 <div
//                   key={idx}
//                   className="flex justify-between items-center pb-2 last:border-0"
//                 >
//                   <span>{item.title}</span>
//                   <span className="text-xs sm:text-sm text-gray-400">
//                     {item.status}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Response Quality */}
//           <div className="p-4 sm:p-6 lg:p-8 bg-[#171717] rounded-2xl border border-gray-700 shadow-md">
//             <h3 className="text-white text-lg font-semibold leading-tight">
//               Response Quality
//             </h3>
//             <div className="mt-5 space-y-4">
//               {[
//                 { title: "Product Manual v2.1.pdf", score: 92 },
//                 { title: "Customer Guidelines.docx", score: 87 },
//                 { title: "FAQ Database.txt", score: 89 },
//               ].map((item, idx) => (
//                 <div
//                   key={idx}
//                   className="flex justify-between items-center gap-4 text-sm sm:text-base text-gray-300"
//                 >
//                   <span className="flex-1">{item.title}</span>
//                   <ProgressBar step={item.score} total={100} />
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TrainingPreview;
// components/TrainingPreview.tsx
import React from "react";
import { Play, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { useTraining } from "@/hooks/useTraining";
// import { useTraining } from '@/hooks/useTraining';

interface TrainingPreviewProps {
  userId: string;
  fileId: string;
  fileName: string;
}

const conversation = [
  { id: 1, sender: "user", text: "Hi, can you help me with my order?" },
  { id: 2, sender: "agent", text: "Of course! Can you share your order ID?" },
  { id: 3, sender: "user", text: "Yes, it's #12345." },
  {
    id: 4,
    sender: "agent",
    text: "Thanks! Your order is on the way and should arrive tomorrow.",
  },
  { id: 5, sender: "user", text: "Perfect, thank you!" },
  { id: 6, sender: "agent", text: "You're welcome! 😊" },
];

const TrainingPreview: React.FC<TrainingPreviewProps> = ({ userId, fileId, fileName }) => {
  const { trainingState, startTraining, resetTraining } = useTraining();

  const ProgressBar = ({ step, total }: { step: number; total: number }) => (
    <div className="flex items-center gap-3">
      <div className="w-10 lg:w-20 rounded-full bg-gray-600 h-2 overflow-hidden">
        <div
          className="bg-[#ef3e6d] h-2 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
      <span className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">
        {Math.round((step / total) * 100)}%
      </span>
    </div>
  );

  const handleStartTraining = async () => {
    if (trainingState.status === 'error') {
      resetTraining();
    }
    
    try {
      await startTraining(userId, fileId);
    } catch (error) {
      console.error('Training failed:', error);
    }
  };

  const getButtonContent = () => {
    switch (trainingState.status) {
      case 'training':
        return (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Training... {trainingState.progress}%
          </>
        );
      case 'completed':
        return (
          <>
            <CheckCircle className="w-4 h-4" />
            Training Complete
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="w-4 h-4" />
            Retry Training
          </>
        );
      default:
        return (
          <>
            <Play className="w-4 h-4" />
            Start Training
          </>
        );
    }
  };

  return (
    <div className="w-full mx-auto p-4 sm:p-6 lg:p-8 bg-[#171717] rounded-2xl border border-gray-700 shadow-md mt-8">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-white text-lg font-semibold leading-tight">
            Training Preview
          </h3>
          {trainingState.knowledgebaseId && (
            <p className="text-sm text-gray-400 mt-1">
              Knowledge Base ID: {trainingState.knowledgebaseId}
            </p>
          )}
        </div>

        <button
          onClick={handleStartTraining}
          disabled={trainingState.isTraining}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition w-full sm:w-auto ${
            trainingState.status === 'error'
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : trainingState.status === 'completed'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-[#262626] hover:bg-[#333] text-gray-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {getButtonContent()}
        </button>
      </div>

      {/* Training Status */}
      {trainingState.status !== 'idle' && (
        <div className="mt-4 p-4 bg-[#262626] rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm font-medium">
              Training Status: {trainingState.status.charAt(0).toUpperCase() + trainingState.status.slice(1)}
            </span>
            <span className="text-gray-400 text-sm">{trainingState.progress}%</span>
          </div>
          <ProgressBar step={trainingState.progress} total={100} />
          {trainingState.error && (
            <p className="text-red-400 text-sm mt-2">{trainingState.error}</p>
          )}
        </div>
      )}

      {/* Main content grid */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 mt-8">
        {/* Left panel */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#171717] rounded-2xl border border-gray-700 shadow-md">
          <h3 className="text-white text-lg font-semibold leading-tight mb-4">
            Sample Conversation
          </h3>

          <div className="space-y-4">
            {conversation.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs sm:max-w-sm md:max-w-md px-4 py-2 rounded-xl text-sm ${
                    msg.sender === "user"
                      ? "bg-[#ef3e6d] text-white rounded-br-none"
                      : "bg-[#262626] text-gray-200 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Knowledge Sources */}
          <div className="p-4 sm:p-6 lg:p-8 bg-[#171717] rounded-2xl border border-gray-700 shadow-md">
            <h3 className="text-white text-lg font-semibold leading-tight">
              Knowledge Sources
            </h3>
            <div className="mt-5 space-y-3 text-sm sm:text-base text-gray-300">
              {[
                { title: fileName, status: trainingState.status === 'completed' ? 'Trained' : 'Pending' },
                { title: "Customer Guidelines.docx", status: "Active" },
                { title: "FAQ Database.txt", status: "Active" },
                { title: "Auto-Generated FAQs", status: "156 items" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center pb-2 last:border-0"
                >
                  <span>{item.title}</span>
                  <span className={`text-xs sm:text-sm ${
                    item.status === 'Trained' ? 'text-green-400' : 
                    item.status === 'Pending' ? 'text-yellow-400' : 'text-gray-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Response Quality */}
          <div className="p-4 sm:p-6 lg:p-8 bg-[#171717] rounded-2xl border border-gray-700 shadow-md">
            <h3 className="text-white text-lg font-semibold leading-tight">
              Response Quality
            </h3>
            <div className="mt-5 space-y-4">
              {[
                { title: fileName, score: trainingState.status === 'completed' ? 92 : 0 },
                { title: "Customer Guidelines.docx", score: 87 },
                { title: "FAQ Database.txt", score: 89 },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center gap-4 text-sm sm:text-base text-gray-300"
                >
                  <span className="flex-1">{item.title}</span>
                  <ProgressBar step={item.score} total={100} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingPreview;