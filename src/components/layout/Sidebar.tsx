import { BuildingTree } from '../navigation/BuildingTree';

export function Sidebar() {
  return (
    <aside className="w-72 shrink-0 bg-white border-r flex flex-col overflow-hidden">
      <div className="p-4 border-b">
        <h1 className="text-sm font-semibold text-gray-900">샘플 아파트 단지</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <BuildingTree />
      </div>
    </aside>
  );
}
