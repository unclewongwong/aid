'use client';

import { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Play, Pause, ZoomIn, ZoomOut, Maximize2, Grid3x3 } from 'lucide-react';
import { Storyboard } from '@/types';

interface StoryboardNode extends Node {
  data: {
    sceneNumber: number;
    prompt: string;
    imageUrl?: string;
    videoUrl?: string;
    status?: string;
    videoStatus?: string;
    dialogue?: string;
  };
}

interface CanvasModeProps {
  storyboards: Storyboard[];
  onUpdate?: (storyboard: Storyboard) => void;
  onPlay?: (storyboardId: string) => void;
  isPlaying?: boolean;
}

export default function CanvasMode({
  storyboards,
  onUpdate,
  onPlay,
  isPlaying = false,
}: CanvasModeProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const initialNodes: StoryboardNode[] = useMemo(() => {
    const nodesPerRow = 3;
    return storyboards.map((sb, index) => {
      const row = Math.floor(index / nodesPerRow);
      const col = index % nodesPerRow;
      return {
        id: sb.id,
        type: 'default',
        position: { x: col * 350, y: row * 400 },
        data: {
          sceneNumber: sb.sceneNumber,
          prompt: sb.prompt,
          imageUrl: sb.imageUrl,
          videoUrl: sb.videoUrl,
          status: sb.status,
          videoStatus: sb.videoStatus,
          dialogue: sb.dialogueLines?.map(l => l.text).join(' ') || '',
        },
      };
    });
  }, [storyboards]);

  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    for (let i = 0; i < storyboards.length - 1; i++) {
      edges.push({
        id: `e${storyboards[i].id}-${storyboards[i + 1].id}`,
        source: storyboards[i].id,
        target: storyboards[i + 1].id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'var(--accent-blue)', strokeWidth: 2 },
      });
    }
    return edges;
  }, [storyboards]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  const selectedStoryboard = storyboards.find(sb => sb.id === selectedNode);

  return (
    <div className="w-full h-full bg-[var(--bg-primary)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
        className="bg-[var(--bg-primary)]"
        style={{
          '--background-color': 'var(--bg-primary)',
          '--grid-color': 'var(--border-color)',
        } as React.CSSProperties}
      >
        <Background
          color="var(--border-color)"
          gap={20}
          size={1}
        />
        <Controls
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
          }}
        />
        <MiniMap
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
          }}
          nodeColor="#007bff"
          maskColor="rgba(0, 0, 0, 0.2)"
        />

        {/* Top Control Panel */}
        <Panel
          position="top-left"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-[var(--text-primary)]">
              Canvas Mode
            </span>
            <div className="h-6 w-px bg-[var(--border-color)]" />
            <span className="text-xs font-mono text-[var(--text-secondary)]">
              {storyboards.length} scenes
            </span>
            <div className="h-6 w-px bg-[var(--border-color)]" />
            <span className="text-xs font-mono text-[var(--text-secondary)]">
              {storyboards.filter(s => s.status === 'completed').length} images
            </span>
            <div className="h-6 w-px bg-[var(--border-color)]" />
            <span className="text-xs font-mono text-[var(--text-secondary)]">
              {storyboards.filter(s => s.videoStatus === 'completed').length} videos
            </span>
          </div>
        </Panel>

        {/* Selected Node Details Panel */}
        {selectedStoryboard && (
          <Panel
            position="top-right"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '16px',
              width: '320px',
              maxHeight: '500px',
              overflowY: 'auto',
            }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono text-[var(--text-primary)]">
                  Scene {selectedStoryboard.sceneNumber}
                </h3>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  ×
                </button>
              </div>

              {selectedStoryboard.imageUrl && (
                <div className="relative aspect-video bg-[var(--bg-tertiary)] rounded overflow-hidden">
                  <img
                    src={selectedStoryboard.imageUrl}
                    alt={`Scene ${selectedStoryboard.sceneNumber}`}
                    className="w-full h-full object-contain"
                  />
                  {selectedStoryboard.videoUrl && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-[var(--accent-green)] text-white text-xs rounded">
                      Video Ready
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-xs font-mono text-[var(--text-secondary)] mb-2">
                  Prompt
                </p>
                <p className="text-xs text-[var(--text-primary)] line-clamp-3">
                  {selectedStoryboard.prompt}
                </p>
              </div>

              {selectedStoryboard.dialogueLines && selectedStoryboard.dialogueLines.length > 0 && (
                <div>
                  <p className="text-xs font-mono text-[var(--text-secondary)] mb-2">
                    Dialogue
                  </p>
                  <div className="text-xs text-[var(--text-primary)] space-y-1">
                    {selectedStoryboard.dialogueLines.map((line, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-[var(--accent-blue)]">{line.character}:</span>
                        <span>{line.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)]">
                <div className="flex-1">
                  <div className="text-xs font-mono text-[var(--text-secondary)] mb-1">
                    Image Status
                  </div>
                  <div className={`text-xs ${
                    selectedStoryboard.status === 'completed' ? 'text-[var(--accent-green)]' :
                    selectedStoryboard.status === 'generating' ? 'text-[var(--accent-orange)]' :
                    'text-[var(--text-secondary)]'
                  }`}>
                    {selectedStoryboard.status || 'Pending'}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-mono text-[var(--text-secondary)] mb-1">
                    Video Status
                  </div>
                  <div className={`text-xs ${
                    selectedStoryboard.videoStatus === 'completed' ? 'text-[var(--accent-green)]' :
                    selectedStoryboard.videoStatus === 'generating' ? 'text-[var(--accent-orange)]' :
                    'text-[var(--text-secondary)]'
                  }`}>
                    {selectedStoryboard.videoStatus || 'Pending'}
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
