import { Sidebar } from './components/layout/Sidebar';
import { DrawingViewer } from './components/layout/DrawingViewer';
import { RevisionBar } from './components/layout/RevisionBar';
import { Breadcrumb } from './components/common/Breadcrumb';

export default function App() {
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Breadcrumb />
          <DrawingViewer />
        </main>
      </div>
      <RevisionBar />
    </div>
  );
}
