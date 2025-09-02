// PWA 캐시 삭제 유틸리티
// 브라우저 콘솔에서 실행하거나 임시 페이지에서 사용

async function clearAllCaches() {
  try {
    // Service Worker 캐시 삭제
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log('발견된 캐시들:', cacheNames);
      
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log('삭제 중:', cacheName);
          return caches.delete(cacheName);
        })
      );
      console.log('✅ 모든 캐시가 삭제되었습니다.');
    }

    // Service Worker 등록 해제
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => {
          console.log('Service Worker 등록 해제 중:', registration.scope);
          return registration.unregister();
        })
      );
      console.log('✅ Service Worker가 등록 해제되었습니다.');
    }

    // Local Storage 삭제
    localStorage.clear();
    console.log('✅ Local Storage가 삭제되었습니다.');

    // Session Storage 삭제
    sessionStorage.clear();
    console.log('✅ Session Storage가 삭제되었습니다.');

    // IndexedDB 삭제 (Supabase 캐시 포함)
    if ('indexedDB' in window) {
      // 일반적인 Supabase IndexedDB 이름들
      const dbNames = ['supabase-cache', 'keyval-store', 'workbox-precache'];
      
      for (const dbName of dbNames) {
        try {
          const deleteReq = indexedDB.deleteDatabase(dbName);
          await new Promise((resolve, reject) => {
            deleteReq.onsuccess = () => resolve(true);
            deleteReq.onerror = () => reject(deleteReq.error);
          });
          console.log(`✅ IndexedDB '${dbName}' 삭제됨`);
        } catch (error) {
          console.log(`⚠️ IndexedDB '${dbName}' 삭제 실패 (존재하지 않을 수 있음)`);
        }
      }
    }

    alert('🧹 모든 PWA 캐시가 삭제되었습니다!\n페이지를 새로고침합니다.');
    window.location.reload();
    
  } catch (error) {
    console.error('캐시 삭제 중 오류:', error);
    alert('❌ 캐시 삭제 중 오류가 발생했습니다. 개발자 도구 콘솔을 확인해주세요.');
  }
}

// 브라우저 콘솔에서 실행
console.log('💡 PWA 캐시를 삭제하려면 clearAllCaches() 함수를 실행하세요.');