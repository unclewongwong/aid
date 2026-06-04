'use client';

import { useCallback, useMemo, useState, useRef } from 'react';
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
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Play, Pause, ZoomIn, ZoomOut, Maximize2, Grid3x3, Edit2, X, Eye, Save } from 'lucide-react';
import { Storyboard } from '@/types';

interface StoryboardNode extends Node {
  data: {
    sceneNumber: number;
    prompt: string;
    videoPrompt?: string;
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

function CanvasModeContent({
  storyboards,
  onUpdate,
}: CanvasModeProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editVideoPrompt, setEditVideoPrompt] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const initialNodes: StoryboardNode[] = useMemo(() => {
    const nodesPerRow = 3;
    return storyboards.map((sb, index) => {
      const row = Math.floor(index / nodesPerRow);
      const col = index % nodesPerRow;
      return {
        id: sb.id,
        type: 'default',
        position: { x: col * 350, y: row * 450 },
        data: {
          sceneNumber: sb.sceneNumber,
          prompt: sb.prompt,
          videoPrompt: sb.videoPrompt,
          imageUrl: sb.imageUrl,
          videoUrl: sb.videoUrl,
          status: sb.status,
          videoStatus: sb.videoStatus,
          dialogue: sb.dialogueLines?.map(l => l.text).join(' ') || '',
        },
        style: {
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          width: 300,
          padding: '12px',
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
    const sb = storyboards.find(s => s.id === node.id);
    if (sb) {
      setEditPrompt(sb.prompt);
      setEditVideoPrompt(sb.videoPrompt || '');
    }
  }, [storyboards]);

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    const sb = storyboards.find(s => s.id === node.id);
    if (sb?.videoUrl) {
      setPreviewVideo(sb.videoUrl);
    } else if (sb?.imageUrl) {
      // Could open image preview here
    }
  }, [storyboards]);

  const handleEditNode = useCallback((nodeId: string) => {
    setEditingNode(nodeId);
    const sb = storyboards.find(s => s.id === nodeId);
    if (sb) {
      setEditPrompt(sb.prompt);
      setEditVideoPrompt(sb.videoPrompt || '');
    }
  }, [storyboards]);

  const handleSaveEdit = useCallback(() => {
    if (!editingNode || !onUpdate) return;
    const sb = storyboards.find(s => s.id === editingNode);
    if (sb) {
      onUpdate({
        ...sb,
        prompt: editPrompt,
        videoPrompt: editVideoPrompt,
      });
    }
    setEditingNode(null);
  }, [editingNode, editPrompt, editVideoPrompt, storyboards, onUpdate]);

  const handleDeleteConnection = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
  }, [setEdges]);

  const selectedStoryboard = storyboards.find(sb => sb.id === selectedNode);
  const editingStoryboard = storyboards.find(sb => sb.id === editingNode);

  // Custom node renderer
  const nodeTypes = useMemo(() => ({
    custom: ({ data, id }: { data: StoryboardNode['data']; id: string }) => (
      <div
        className="storyboard-node"
        style={{
          width: '100%',
          height: '100%',
          cursor: 'pointer',
        }}
        onClick={(e) => onNodeClick(e, { id, data } as Node)}
        onDoubleClick={(e) => onNodeDoubleClick(e, { id, data } as Node)}
      >
        {data.imageUrl && (
          <div
            className="relative aspect-video bg-[var(--bg-tertiary)] rounded mb-2 overflow-hidden"
            style={{ maxHeight: '120px' }}
          >
            <img
              src={data.imageUrl}
              alt={`Scene ${data.sceneNumber}`}
              className="w-full h-full object-cover"
            />
            {data.videoUrl && (
              <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-[var(--accent-green)] text-white text-xs rounded flex items-center gap-1">
                <Eye size={10} />
                Video
              </div>
            )}
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-xs rounded">
              #{data.sceneNumber}
            </div>
          </div>
        )}
        <div className="text-xs text-[var(--text-primary)] line-clamp-2 mb-1">
          {data.prompt}
        </div>
        <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
          <div className={`w-2 h-2 rounded-full ${
            data.status === 'completed' ? 'bg-[var(--accent-green)]' :
            data.status === 'generating' ? 'bg-[var(--accent-orange)]' :
            'bg-gray-500'
          }`} />
          <span>Image</span>
          <div className={`w-2 h-2 rounded-full ${
            data.videoStatus === 'completed' ? 'bg-[var(--accent-green)]' :
            data.videoStatus === 'generating' ? 'bg-[var(--accent-orange)]' :
            'bg-gray-500'
          }`} />
          <span>Video</span>
        </div>
      </div>
    ),
  }), [onNodeClick, onNodeDoubleClick]);

  return (
    <>
      <ReactFlow
        nodes={nodes.map(n => ({ ...n, type: 'custom' }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        fitView
        nodeTypes={nodeTypes}
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
        {selectedStoryboard && !editingNode && (
          <Panel
            position="top-right"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '16px',
              width: '340px',
              maxHeight: '600px',
              overflowY: 'auto',
            }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono text-[var(--text-primary)]">
                  Scene {selectedStoryboard.sceneNumber}
                </h3>
                <div className="flex items-center gap-2">
                  {onUpdate && (
                    <button
                      onClick={() => handleEditNode(selectedStoryboard.id)}
                      className="text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                  {selectedStoryboard.videoUrl && (
                    <button
                      onClick={() => setPreviewVideo(selectedStoryboard.videoUrl!)}
                      className="text-[var(--text-secondary)] hover:text-[var(--accent-green)] transition-colors"
                      title="Preview video"
                    >
                      <Play size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {selectedStoryboard.imageUrl && (
                <div className="relative aspect-video bg-[var(--bg-tertiary)] rounded overflow-hidden cursor-pointer group">
                  <img
                    src={selectedStoryboard.imageUrl}
                    alt={`Scene ${selectedStoryboard.sceneNumber}`}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm">Double-click to preview</span>
                  </div>
                  {selectedStoryboard.videoUrl && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-[var(--accent-green)] text-white text-xs rounded flex items-center gap-1">
                      <Eye size={10} />
                      Video Ready
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-xs font-mono text-[var(--text-secondary)] mb-2">
                  Prompt
                </p>
                <p className="text-xs text-[var(--text-primary)] whitespace-pre-wrap">
                  {selectedStoryboard.prompt}
                </p>
              </div>

              {selectedStoryboard.videoPrompt && (
                <div>
                  <p className="text-xs font-mono text-[var(--text-secondary)] mb-2">
                    Video Prompt
                  </p>
                  <p className="text-xs text-[var(--text-primary)] whitespace-pre-wrap line-clamp-4">
                    {selectedStoryboard.videoPrompt}
                  </p>
                </div>
              )}

              {selectedStoryboard.dialogueLines && selectedStoryboard.dialogueLines.length > 0 && (
                <div>
                  <p className="text-xs font-mono text-[var(--text-secondary)] mb-2">
                    Dialogue
                  </p>
                  <div className="text-xs text-[var(--text-primary)] space-y-1 max-h-32 overflow-y-auto">
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
                  <div className={`text-xs font-mono ${
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
                  <div className={`text-xs font-mono ${
                    selectedStoryboard.videoStatus === 'completed' ? 'text-[var(--accent-green)]' :
                    selectedStoryboard.videoStatus === 'generating' ? 'text-[var(--accent-orange)]' :
                    'text-[var(--text-secondary)]'
                  }`}>
                    {selectedStoryboard.videoStatus || 'Pending'}
                  </div>
                </div>
              </div>

              {selectedStoryboard.videoUrl && (
                <button
                  onClick={() => setPreviewVideo(selectedStoryboard.videoUrl!)}
                  className="w-full py-2 text-xs font-mono bg-[var(--accent-green)] hover:bg-[#059669] text-white rounded flex items-center justify-center gap-2"
                >
                  <Play size={12} />
                  Preview Video
                </button>
              )}
            </div>
          </Panel>
        )}

        {/* Edit Panel */}
        {editingStoryboard && editingNode && (
          <Panel
            position="top-right"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '16px',
              width: '400px',
              maxHeight: '600px',
              overflowY: 'auto',
            }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono text-[var(--text-primary)]">
                  Edit Scene {editingStoryboard.sceneNumber}
                </h3>
                <button
                  onClick={() => setEditingNode(null)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <X size={14} />
                </button>
              </div>

              <div>
                <label className="block text-xs font-mono text-[var(--text-secondary)] mb-2">
                  Image Prompt
                </label>
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="w-full h-24 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded p-2 text-xs text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--accent-blue)] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[var(--text-secondary)] mb-2">
                  Video Prompt
                </label>
                <textarea
                  value={editVideoPrompt}
                  onChange={(e) => setEditVideoPrompt(e.target.value)}
                  className="w-full h-24 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded p-2 text-xs text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--accent-blue)] font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-2 text-xs font-mono bg-[var(--accent-blue)] hover:bg-[#006bb3] text-white rounded flex items-center justify-center gap-2"
                >
                  <Save size={12} />
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingNode(null)}
                  className="flex-1 py-2 text-xs font-mono bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {/* Video Preview Modal */}
      {previewVideo && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setPreviewVideo(null)}
        >
          <div
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewVideo(null)}
              className="absolute top-4 right-4 text-white hover:text-[var(--accent-blue)] transition-colors z-10"
            >
              <X size={24} />
            </button>
            <video
              ref={videoRef}
              src={previewVideo}
              controls
              autoPlay
              className="max-w-full max-h-full"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default function CanvasMode(props: CanvasModeProps) {
  return (
    <ReactFlowProvider>
      <div className="w-full h-full bg-[var(--bg-primary)]">
        <CanvasModeContent {...props} />
      </div>
    </ReactFlowProvider>
  );
}
