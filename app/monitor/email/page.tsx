// import { Suspense } from "react";
// import EmailManager from "@/components/email-manager";
// import { Mail, Users, Send, Loader2, ArrowLeft } from "lucide-react";
// import Link from "next/link";

// function EmailPageSkeleton() {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
//       {/* Header */}
//       <div className="bg-white shadow-sm border-b">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//           <div className="flex items-center gap-4">
//             <Link
//               href="/matriculas"
//               className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50"
//             >
//               <ArrowLeft className="w-4 h-4" />
//               <span className="text-sm font-medium">Voltar ao Painel</span>
//             </Link>
//             <div className="w-px h-6 bg-gray-300"></div>
//             <div className="flex items-center gap-3">
//               <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
//                 <Mail className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-900">
//                   Email em Massa
//                 </h1>
//                 <p className="text-sm text-gray-600">
//                   Envie emails personalizados para suas alunas e monitores
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Loading Content */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
//           <div className="flex flex-col items-center justify-center py-16 space-y-6">
//             <div className="relative">
//               <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
//                 <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
//               </div>
//               <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
//                 <Mail className="w-3 h-3 text-white" />
//               </div>
//             </div>
//             <div className="text-center">
//               <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                 Carregando Sistema de Email
//               </h3>
//               <p className="text-gray-600 max-w-md">
//                 Preparando a interface para envio de emails personalizados...
//               </p>
//             </div>
//             <div className="flex items-center gap-6 mt-8">
//               <div className="flex items-center gap-2 text-sm text-gray-500">
//                 <Users className="w-4 h-4" />
//                 <span>Carregando destinatários</span>
//               </div>
//               <div className="flex items-center gap-2 text-sm text-gray-500">
//                 <Send className="w-4 h-4" />
//                 <span>Preparando templates</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function EmailPage() {
//   return (
//     <Suspense fallback={<EmailPageSkeleton />}>
//       <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
//         {/* Header */}
//         <div className="bg-white shadow-sm border-b">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//             <div className="flex items-center gap-4">
//               <Link
//                 href="/matriculas"
//                 className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50"
//               >
//                 <ArrowLeft className="w-4 h-4" />
//                 <span className="text-sm font-medium">Voltar ao Painel</span>
//               </Link>
//               <div className="w-px h-6 bg-gray-300"></div>
//               <div className="flex items-center gap-3">
//                 <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
//                   <Mail className="w-6 h-6 text-white" />
//                 </div>
//                 <div>
//                   <h1 className="text-2xl font-bold text-gray-900">
//                     Email em Massa
//                   </h1>
//                   <p className="text-sm text-gray-600">
//                     Envie emails personalizados para suas alunas e monitores
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <EmailManager />
//         </div>
//       </div>
//     </Suspense>
//   );
// }
