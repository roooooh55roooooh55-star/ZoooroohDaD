
import React, { useState, useEffect } from 'react';
import { Video } from './types';
import { fetchCloudinaryVideos } from './cloudinaryClient';
import { analyzeHorrorVideo } from './geminiService';

const LOGO_URL = "https://i.top4top.io/p_3643ksmii1.jpg";

interface AdminDashboardProps {
  onClose: () => void;
  categories: string[];
  onNewVideo?: (v: Video) => void;
  onDeleteVideo?: (id: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onClose, categories, onNewVideo, onDeleteVideo 
}) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState(categories[0] || '');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchCloudinaryVideos().then(data => {
      setVideos(data);
      setLoading(false);
    });
  }, []);

  const openUploadWidget = () => {
    const cloudinary = (window as any).cloudinary;
    if (!cloudinary) return alert("Cloudinary script not loaded");

    setIsUploading(true);
    cloudinary.openUploadWidget(
      {
        cloudName: 'dlrvn33p0',
        uploadPreset: 'Good.zooo',
        folder: 'app_videos',
        tags: ['hadiqa_v4', uploadCategory],
        context: { custom: { caption: uploadTitle || "بدون عنوان" } },
        resourceType: 'video'
      },
      async (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          const newVideo: Video = {
            id: result.info.public_id,
            public_id: result.info.public_id,
            video_url: result.info.secure_url,
            title: uploadTitle || "فيديو جديد",
            category: uploadCategory,
            type: result.info.height > result.info.width ? 'short' : 'long',
            likes: 0,
            views: 0
          };
          
          setVideos(prev => [newVideo, ...prev]);
          if (onNewVideo) onNewVideo(newVideo);
          setUploadTitle('');
          setIsUploading(false);
          alert("تم الرفع بنجاح! يتم الآن استحضار الروح للتحليل...");
        } else if (result?.event === "close") {
          setIsUploading(false);
        }
      }
    );
  };

  const handleDelete = (id: string) => {
    if (window.confirm("حذف الكابوس نهائياً؟")) {
      setVideos(prev => prev.filter(v => (v.id || v.video_url) !== id));
      if (onDeleteVideo) onDeleteVideo(id);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-[#050505] overflow-y-auto p-6 text-right pb-40" dir="rtl">
      <div className="flex items-center justify-between mb-8 border-b border-red-600/30 pb-6">
        <div className="flex items-center gap-4">
          <img src={LOGO_URL} className="w-12 h-12 rounded-full border-2 border-red-600 shadow-[0_0_20px_red]" />
          <h1 className="text-xl font-black text-red-600 italic">إدارة المستودع</h1>
        </div>
        <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl text-red-500 border border-red-600/20 active:scale-75 transition-all">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="mb-12 bg-neutral-900/50 border border-red-600/30 p-8 rounded-[2.5rem] shadow-2xl">
        <h2 className="text-lg font-black text-white mb-6">إضافة كابوس جديد</h2>
        <input 
          type="text" placeholder="عنوان الفيديو" value={uploadTitle}
          onChange={(e) => setUploadTitle(e.target.value)}
          className="w-full bg-black border border-white/10 rounded-2xl p-5 text-white mb-4 outline-none focus:border-red-600 font-bold"
        />
        <select 
          value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}
          className="w-full bg-black border border-white/10 rounded-2xl p-5 text-red-500 font-black mb-6 outline-none"
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button 
          onClick={openUploadWidget} 
          disabled={isUploading} 
          className="w-full bg-red-600 py-5 rounded-2xl font-black text-white shadow-[0_0_30px_red] active:scale-95 disabled:opacity-50"
        >
          {isUploading ? "جاري الرفع..." : "رفع إلى المستودع السحابي"}
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-white italic">المحتوى الحالي ({videos.length})</h2>
        {loading ? (
          <div className="py-20 text-center text-red-600">جاري سحب البيانات...</div>
        ) : (
          videos.map(v => (
            <div key={v.id || v.video_url} className="bg-neutral-900 border border-white/5 p-4 rounded-3xl flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-black">
                  <video src={v.video_url} className="w-full h-full object-cover opacity-60" />
                </div>
                <div>
                  <p className="text-white text-sm font-black">{v.title}</p>
                  <p className="text-red-600 text-[10px] font-bold uppercase">{v.category}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(v.id || v.video_url)} className="p-3 text-red-500 hover:bg-red-600/10 rounded-xl transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
