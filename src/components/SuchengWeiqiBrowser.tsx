import { useState, useEffect, useCallback } from 'react';
import { Book, ChevronLeft, FolderOpen } from 'lucide-react';
import type { DirectoryNode, SuchengWeiqiSession } from '../types';
import { loadSuchengWeiqiData, buildDirectoryTree } from '../lib/suchengweiqiParser';

interface SuchengWeiqiBrowserProps {
  onBack: () => void;
  onSelectSession: (session: SuchengWeiqiSession) => void;
}

type NavigationStack = {
  node: DirectoryNode;
  title: string;
}[];

export const SuchengWeiqiBrowser = ({ onBack, onSelectSession }: SuchengWeiqiBrowserProps) => {
  const [directoryTree, setDirectoryTree] = useState<DirectoryNode[]>([]);
  const [navigationStack, setNavigationStack] = useState<NavigationStack>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const questions = await loadSuchengWeiqiData();
        const tree = buildDirectoryTree(questions);
        setDirectoryTree(tree);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载数据失败');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const currentNode = navigationStack.length > 0
    ? navigationStack[navigationStack.length - 1].node
    : null;

  const displayNodes = currentNode
    ? (currentNode.children || [])
    : directoryTree;

  const handleNodeClick = (node: DirectoryNode) => {
    // 如果是 subChapter（最后一级目录），直接进入套题
    if (node.type === 'subChapter' && node.questions && node.questions.length > 0) {
      const title = navigationStack.length === 0
        ? node.name
        : `${navigationStack[navigationStack.length - 1].title} > ${node.name}`;
      onSelectSession({
        title,
        questions: node.questions,
      });
      return;
    }

    // 否则继续导航
    const title = navigationStack.length === 0
      ? node.name
      : `${navigationStack[navigationStack.length - 1].title} > ${node.name}`;
    setNavigationStack([...navigationStack, { node, title }]);
  };

  const handleBack = useCallback(() => {
    if (navigationStack.length > 0) {
      setNavigationStack(navigationStack.slice(0, -1));
    } else {
      onBack();
    }
  }, [navigationStack, onBack]);

  const getNodeIcon = (node: DirectoryNode) => {
    switch (node.type) {
      case 'book':
        return <Book className="w-6 h-6" />;
      case 'volume':
      case 'chapter':
      case 'subChapter':
        return <FolderOpen className="w-6 h-6" />;
      default:
        return <FolderOpen className="w-6 h-6" />;
    }
  };

  const getNodeColor = (node: DirectoryNode) => {
    switch (node.type) {
      case 'book':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'volume':
        return 'bg-green-500 hover:bg-green-600';
      case 'chapter':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'subChapter':
        return 'bg-purple-500 hover:bg-purple-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-500 text-white rounded-xl font-bold hover:bg-gray-600 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-8">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-800 truncate">
                {navigationStack.length > 0
                  ? navigationStack[navigationStack.length - 1].title
                  : '速成围棋题库'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="grid gap-3">
          {displayNodes.map((node, index) => (
            <button
              key={`${node.type}-${node.name}-${index}`}
              onClick={() => handleNodeClick(node)}
              className={`flex items-center gap-4 p-4 rounded-xl text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md border-b-4 ${
                getNodeColor(node)
              }`}
              style={{
                borderBottomColor: 'rgba(0,0,0,0.2)',
              }}
            >
              <div className="flex-shrink-0">
                {getNodeIcon(node)}
              </div>
              <div className="flex-1 text-left">
                <span className="font-bold text-lg">{node.name}</span>
                {node.children && node.children.length > 0 && (
                  <span className="ml-2 text-sm opacity-80">
                    ({node.children.length} 项)
                  </span>
                )}
                {node.questions && node.questions.length > 0 && (
                  <span className="ml-2 text-sm opacity-80">
                    ({node.questions.length} 题)
                  </span>
                )}
              </div>
              <ChevronLeft className="w-5 h-5 transform rotate-180 opacity-80" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
