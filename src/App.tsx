import { Sidebar } from './components/layout/Sidebar';
import { DrawingViewer } from './components/layout/DrawingViewer';
import { RevisionBar } from './components/layout/RevisionBar';
import { Breadcrumb } from './components/common/Breadcrumb';
import { CompareButton } from './components/viewer/CompareButton';

export default function App() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 상단 헤더: 경로 표시 + 공종 비교 버튼 */}
        <div className="flex items-center border-b bg-white shrink-0 px-4 py-2 gap-4">
          <Breadcrumb />
          <CompareButton />
        </div>
        <DrawingViewer />
        <RevisionBar />
      </main>
    </div>
  );
}
