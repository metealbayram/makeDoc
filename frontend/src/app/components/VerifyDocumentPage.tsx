import { useState, useEffect } from "react";
import api from "../services/api";

import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

interface SignatureDetail {
  originalHash: string;
  embeddedHash: string;
  signerName: string;
  timestamp: string;
  signatureShort: string;
}

interface VerificationResult {
  valid: boolean;
  error?: string;
  signatures?: SignatureDetail[];
}

export default function VerifyDocumentPage() {
  const [userName, setUserName] = useState("");
  const [userJob, setUserJob] = useState("");
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    const storedImage = localStorage.getItem("userProfileImage");
    const storedJob = localStorage.getItem("userJob");
    if (storedName) setUserName(storedName);
    if (storedJob) setUserJob(storedJob);
    if (storedImage) {
      if (storedImage.startsWith("http")) {
        setUserProfileImage(storedImage);
      } else {
        setUserProfileImage(`http://localhost:5000${storedImage}`);
      }
    }
  }, []);

  const handleProfileImageUpdate = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) return;
      const formData = new FormData();
      formData.append("profileImage", file);
      try {
        const response = await api.put("/users/profile/image", formData);
        if (response.data.success) {
          const newImagePath = response.data.data.profileImage;
          localStorage.setItem("userProfileImage", newImagePath);
          setUserProfileImage(`http://localhost:5000${newImagePath}`);
        }
      } catch (error) {
        console.error("Failed to update profile image:", error);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
    }
  };

  const handleVerify = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const response = await api.post("/documents/verify", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setResult(response.data);
    } catch (error: any) {
      if (error.response && error.response.data) {
        setResult(error.response.data);
      } else {
        setResult({
          valid: false,
          error: "Verification failed due to a server error.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface antialiased overflow-x-hidden min-h-screen dark:bg-[#111621] dark:text-white">
      <Navbar
        userName={userName}
        userProfileImage={userProfileImage}
        onProfileImageUpdate={handleProfileImageUpdate}
      />
      <Sidebar
        userName={userName}
        userJob={userJob}
        userProfileImage={userProfileImage}
        onProfileImageUpdate={handleProfileImageUpdate}
      />

      <main className="ml-72 pt-28 px-12 pb-12 min-h-screen">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-10 text-center">
             <div className="flex justify-center mb-4 text-primary">
                 <span className="material-symbols-outlined text-6xl">verified</span>
             </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface font-headline dark:text-white mb-2">
              Verify Document
            </h1>
            <p className="text-on-surface-variant dark:text-slate-400">
              Upload a document to check its authenticity and embedded digital signatures.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 dark:bg-[#1e2532] dark:border-slate-800 space-y-6">
              
              {/* Upload Area */}
              <div 
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${file ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-[#252d3d]"}`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                  <input id="file-upload" type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                  {file ? (
                      <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-primary shadow-sm">
                             <span className="material-symbols-outlined text-3xl">task</span>
                          </div>
                          <p className="font-bold text-on-surface dark:text-white">{file.name}</p>
                          <p className="text-xs text-on-surface-variant dark:text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center gap-2">
                          <span className="material-symbols-outlined text-4xl text-slate-400">upload_file</span>
                          <p className="font-bold text-on-surface dark:text-white">Click or drag PDF here</p>
                          <p className="text-xs text-on-surface-variant dark:text-slate-400">Only .pdf format is supported</p>
                      </div>
                  )}
              </div>

              {/* Verify Button */}
              <button
                disabled={!file || loading}
                onClick={handleVerify}
                className="w-full bg-gradient-to-br from-primary to-primary-dim text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {loading ? (
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                    <span className="material-symbols-outlined">security</span>
                )}
                {loading ? "Verifying..." : "Verify Signatures"}
              </button>

              {/* Result Area */}
              {result && (
                  <div className={`mt-8 p-6 rounded-xl border ${result.valid ? 'bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/20' : 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20'}`}>
                      <div className="flex items-start gap-4">
                          <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${result.valid ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-500' : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-500'}`}>
                              <span className="material-symbols-outlined">
                                  {result.valid ? 'verified' : 'gpp_bad'}
                              </span>
                          </div>
                          <div className="flex-1">
                              <h3 className={`text-lg font-bold mb-1 ${result.valid ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                                  {result.valid ? 'Document is Valid & Signed' : 'Verification Failed'}
                              </h3>
                              <p className={`text-sm ${result.valid ? 'text-green-600 dark:text-green-500/80' : 'text-red-600 dark:text-red-500/80'}`}>
                                  {result.valid ? 'All embedded signatures match the document content. The file has not been tampered with.' : (result.error || 'The document signatures could not be verified.')}
                              </p>

                              {result.signatures && result.signatures.length > 0 && (
                                  <div className="mt-6 space-y-4">
                                      <h4 className="text-sm font-bold text-on-surface dark:text-white">Signatures Found:</h4>
                                      {result.signatures.map((sig, index) => (
                                          <div key={index} className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm dark:bg-[#111621] dark:border-slate-800">
                                              <div className="flex justify-between items-start mb-2">
                                                  <div className="font-bold flex items-center gap-2 text-on-surface dark:text-white">
                                                      <span className="material-symbols-outlined text-sm text-primary">draw</span>
                                                      {sig.signerName}
                                                  </div>
                                                  <span className="text-xs text-slate-500">
                                                      {new Date(sig.timestamp).toLocaleString('tr-TR')}
                                                  </span>
                                              </div>
                                              <div className="text-xs font-mono text-slate-400 bg-slate-50 p-2 rounded break-all dark:bg-[#1e2532]">
                                                  {sig.signatureShort}
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              )}
          </div>
        </div>
      </main>
    </div>
  );
}
