
import React, { useState, useEffect, useCallback } from 'react';
import { Video, AppView, UserInteractions } from './types.ts';
import { fetchCloudinaryVideos } from './cloudinaryClient.ts';
import AppBar from './AppBar.tsx';
import MainContent from './MainContent.tsx';
import ShortsPlayerOverlay from './ShortsPlayerOverlay.tsx';
import LongPlayerOverlay from './LongPlayerOverlay.tsx';
import TrendPage from './TrendPage.tsx';
import SavedPage from './SavedPage.tsx';
import UnwatchedPage from './UnwatchedPage.tsx';
import PrivacyPage from './PrivacyPage.tsx';
import HiddenVideosPage from './HiddenVideosPage.tsx';
import AIOracle from './AIOracle.tsx';
import AdminDashboard from './AdminDashboard.tsx';

const DEFAULT_CATEGORIES = ['رعب حقيقي', 'قصص رعب', 'غموض', 'ما وراء الطبيعة', 'أرشيف المطور'];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [rawVideos, setRawVideos] = useState<Video[]>([]); 
  const [loading, setLoading] = useState(true);
  const [selectedShort, setSelectedShort] = useState<{ video: Video, list: Video[] } | null>(null);
  const [selectedLong, setSelectedLong] = useState<{ video: Video, list: Video[] } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deletedByAdmin, setDeletedByAdmin] = useState<string[]>(() => {
    const saved = localStorage.getItem('al-hadiqa-deleted-ids');
    return saved ? JSON.parse(saved) : [];
  });
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('al-hadiqa-categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });
  const [interactions, setInteractions] = useState<UserInteractions>(() => {
    try {
      const saved = localStorage.getItem('al-hadiqa-interactions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { likedIds: [], dislikedIds: [], savedIds: [], watchHistory: [] };
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCloudinaryVideos();
      const filtered = data.filter(v => !deletedByAdmin.includes(v.id || v.video_url));
      setRawVideos(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [deletedByAdmin]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { localStorage.setItem('al-hadiqa-interactions', JSON.stringify(interactions)); }, [interactions]);

  const updateWatchHistory = (id: string, progress: number) => {
    setInteractions(prev => {
      const history = [...prev.watchHistory];
      const index = history.findIndex(h => h.id === id);
      if (index > -1) { if (progress > history[index].progress) history[index].progress = progress; }
      else { history.push({ id, progress }); }
      return { ...prev, watchHistory: history };
    });
  };

  const renderContent = () => {
    if (currentView === AppView.ADMIN) {
      return (
        <AdminDashboard 
          onClose={() => setCurrentView(AppView.HOME)} 
          categories={categories}
          onNewVideo={(v) => { setRawVideos(p => [v, ...p]); showToast("تم الرفع والتحليل"); }}
          onDeleteVideo={(id) => {
            setDeletedByAdmin(p => [...p, id]);
            setRawVideos(v => v.filter(x => (x.id || x.video_url) !== id));
          }}
        />
      );
    }

    switch (currentView) {
      case AppView.TREND: return <TrendPage onPlayShort={(v, l) => setSelectedShort({video:v, list:l})} onPlayLong={(v) => setSelectedLong({video:v, list:rawVideos})} excludedIds={interactions.dislikedIds} />;
      case AppView.LIKES: return <SavedPage title="الإعجابات" savedIds={interactions.likedIds} allVideos={rawVideos} onPlayShort={(v, l) => setSelectedShort({video:v, list:l})} onPlayLong={(v) => setSelectedLong({video:v, list:rawVideos})} />;
      case AppView.SAVED: return <SavedPage title="المحفوظات" savedIds={interactions.savedIds} allVideos={rawVideos} onPlayShort={(v, l) => setSelectedShort({video:v, list:l})} onPlayLong={(v) => setSelectedLong({video:v, list:rawVideos})} />;
      case AppView.UNWATCHED: return <UnwatchedPage watchHistory={interactions.watchHistory} allVideos={rawVideos} onPlayShort={(v, l) => setSelectedShort({video:v, list:l})} onPlayLong={(v) => setSelectedLong({video:v, list:rawVideos})} />;
      case AppView.PRIVACY: return <PrivacyPage onOpenAdmin={() => setCurrentView(AppView.ADMIN)} />;
      case AppView.HIDDEN: return <HiddenVideosPage interactions={interactions} allVideos={rawVideos} onRestore={(id) => setInteractions(p => ({...p, dislikedIds: p.dislikedIds.filter(x => x !== id)}))} onPlayShort={(v, l) => setSelectedShort({video:v, list:l})} onPlayLong={(v) => setSelectedLong({video:v, list:rawVideos})} />;
      default:
        return (
          <MainContent 
            videos={rawVideos} categoriesList={categories} interactions={interactions}
            onPlayShort={(v, l) => setSelectedShort({video:v, list:l})}
            onPlayLong={(v, l) => setSelectedLong({video:v, list:l})}
            onResetHistory={loadData} loading={loading} onShowToast={showToast}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <AppBar onViewChange={setCurrentView} onRefresh={loadData} currentView={currentView} />
      <main className="pt-24">{renderContent()}</main>
      <AIOracle />
      {toast && <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[1100] bg-red-600 px-6 py-2 rounded-full font-bold shadow-lg shadow-red-600/40">{toast}</div>}
      {selectedShort && <ShortsPlayerOverlay initialVideo={selectedShort.video} videoList={selectedShort.list} interactions={interactions} onClose={() => setSelectedShort(null)} onLike={(id) => setInteractions(p => ({...p, likedIds: [...p.likedIds, id]}))} onDislike={() => {}} onSave={() => {}} onProgress={updateWatchHistory} />}
      {selectedLong && <LongPlayerOverlay video={selectedLong.video} allLongVideos={selectedLong.list} onClose={() => setSelectedLong(null)} onLike={() => {}} onDislike={() => {}} onSave={() => {}} onSwitchVideo={(v) => setSelectedLong({video:v, list:selectedLong.list})} isLiked={false} isDisliked={false} isSaved={false} onProgress={(p) => updateWatchHistory(selectedLong.video.id, p)} />}
    </div>
  );
};

export default App;
