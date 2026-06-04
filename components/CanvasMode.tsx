'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Connection,
  Controls,
  Edge,
  Handle,
  MarkerType,
  MiniMap,
  Node,
  NodeProps,
  Panel,
  Position,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Bot,
  Clapperboard,
  Edit2,
  FileVideo,
  Image as ImageIcon,
  Layers3,
  Mic2,
  Play,
  Save,
  Scissors,
  Sparkles,
  Video,
  X,
} from 'lucide-react';
import { Storyboard } from '@/types';

type WorkflowNodeKind = 'scene' | 'operation' | 'output';
type OperationKind = 'image' | 'videoPrompt' | 'audio' | 'video' | 'export';

type WorkflowNodeData = {
  kind: WorkflowNodeKind;
  title: string;
  subtitle?: string;
  description?: string;
  storyboardId?: string;
  operation?: OperationKind;
  sceneNumber?: number;
  prompt?: string;
  videoPrompt?: string;
  imageUrl?: string;
  videoUrl?: string;
  status?: string;
  videoStatus?: string;
  audioStatus?: string;
};

type WorkflowNode = Node<WorkflowNodeData>;

interface CanvasModeProps {
  storyboards: Storyboard[];
  onUpdate?: (storyboard: Storyboard) => void;
  onGenerateImage?: (storyboard: Storyboard) => void | Promise<void>;
  onGenerateVideoPrompt?: (storyboard: Storyboard) => void | Promise<void>;
  onGenerateAudio?: (storyboard: Storyboard) => void | Promise<void>;
  onGenerateVideo?: (storyboard: Storyboard) => void | Promise<void>;
}

const operations: Array<{
  id: OperationKind;
  title: string;
  subtitle: string;
  description: string;
}> = [
  {
    id: 'image',
    title: 'Generate Image',
    subtitle: 'Prompt to keyframe',
    description: 'Use each connected scene prompt and references to create storyboard images.',
  },
  {
    id: 'videoPrompt',
    title: 'Motion Prompt',
    subtitle: 'Shot to movement',
    description: 'Write a motion/video prompt for every connected scene.',
  },
  {
    id: 'audio',
    title: 'Dialogue Audio',
    subtitle: 'Lines to voice',
    description: 'Generate per-character audio from connected scene dialogue.',
  },
  {
    id: 'video',
    title: 'Generate Video',
    subtitle: 'Image + prompt to clip',
    description: 'Generate clips from connected scene images, motion prompts, and optional audio.',
  },
  {
    id: 'export',
    title: 'Review Output',
    subtitle: 'Ready clips',
    description: 'Collect connected clips for final review and export.',
  },
];

const operationIcon: Record<OperationKind, typeof ImageIcon> = {
  image: ImageIcon,
  videoPrompt: Sparkles,
  audio: Mic2,
  video: Video,
  export: FileVideo,
};

const operationOrder: OperationKind[] = ['image', 'videoPrompt', 'audio', 'video', 'export'];

function statusTone(status?: string) {
  if (status === 'completed') return 'bg-[var(--accent-green)]';
  if (status === 'generating') return 'bg-[var(--accent-orange)]';
  if (status === 'failed') return 'bg-[var(--accent-red)]';
  return 'bg-[var(--text-secondary)]';
}

function SceneNode({ data, selected }: NodeProps<WorkflowNodeData>) {
  return (
    <div className={`w-[280px] overflow-hidden rounded border bg-[var(--bg-secondary)] shadow-lg ${selected ? 'border-[var(--accent-blue)]' : 'border-[var(--border-color)]'}`}>
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-[var(--bg-primary)] !bg-[var(--accent-blue)]" />
      <div className="relative aspect-video bg-[var(--bg-tertiary)]">
        {data.imageUrl ? (
          <img src={data.imageUrl} alt={data.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--text-secondary)]">
            <ImageIcon size={28} />
          </div>
        )}
        <div className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-[11px] font-mono text-white">
          Scene {data.sceneNumber}
        </div>
        {data.videoUrl && (
          <div className="absolute bottom-2 right-2 rounded bg-[var(--accent-green)] px-2 py-1 text-[11px] font-mono text-white">
            Video
          </div>
        )}
      </div>
      <div className="space-y-3 p-3">
        <p className="line-clamp-3 text-xs leading-5 text-[var(--text-primary)]">{data.prompt}</p>
        <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-[var(--text-secondary)]">
          <div className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${statusTone(data.status)}`} />
            Image
          </div>
          <div className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${statusTone(data.audioStatus)}`} />
            Audio
          </div>
          <div className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${statusTone(data.videoStatus)}`} />
            Video
          </div>
        </div>
      </div>
    </div>
  );
}

function OperationNode({ data, selected }: NodeProps<WorkflowNodeData>) {
  const Icon = data.operation ? operationIcon[data.operation] : Bot;

  return (
    <div className={`w-[230px] rounded border bg-[var(--bg-secondary)] p-3 shadow-lg ${selected ? 'border-[var(--accent-blue)]' : 'border-[var(--border-color)]'}`}>
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-[var(--bg-primary)] !bg-[var(--accent-green)]" />
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-[var(--bg-primary)] !bg-[var(--accent-blue)]" />
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[var(--bg-tertiary)] text-[var(--text-accent)]">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--text-primary)]">{data.title}</div>
          <div className="text-[11px] font-mono text-[var(--text-secondary)]">{data.subtitle}</div>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">{data.description}</p>
    </div>
  );
}

function OutputNode({ data, selected }: NodeProps<WorkflowNodeData>) {
  return (
    <div className={`w-[220px] rounded border bg-[var(--bg-secondary)] p-3 shadow-lg ${selected ? 'border-[var(--accent-blue)]' : 'border-[var(--border-color)]'}`}>
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-[var(--bg-primary)] !bg-[var(--accent-green)]" />
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded bg-[var(--bg-tertiary)] text-[var(--accent-green)]">
          <Clapperboard size={18} />
        </div>
        <div>
          <div className="text-sm font-semibold text-[var(--text-primary)]">{data.title}</div>
          <div className="text-[11px] font-mono text-[var(--text-secondary)]">{data.subtitle}</div>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">{data.description}</p>
    </div>
  );
}

function buildNodes(storyboards: Storyboard[], previousNodes: WorkflowNode[] = []): WorkflowNode[] {
  const previousPositions = new Map(previousNodes.map((node) => [node.id, node.position]));
  const sceneNodes: WorkflowNode[] = storyboards.map((sb, index) => ({
    id: `scene:${sb.id}`,
    type: 'sceneNode',
    position: previousPositions.get(`scene:${sb.id}`) || { x: 40, y: 60 + index * 220 },
    data: {
      kind: 'scene',
      title: `Scene ${sb.sceneNumber}`,
      storyboardId: sb.id,
      sceneNumber: sb.sceneNumber,
      prompt: sb.prompt,
      videoPrompt: sb.videoPrompt,
      imageUrl: sb.imageUrl,
      videoUrl: sb.videoUrl,
      status: sb.status,
      videoStatus: sb.videoStatus,
      audioStatus: sb.audioStatus,
    },
  }));

  const operationNodes: WorkflowNode[] = operations.map((operation, index) => ({
    id: `op:${operation.id}`,
    type: 'operationNode',
    position: previousPositions.get(`op:${operation.id}`) || { x: 430 + index * 290, y: 120 },
    data: {
      kind: 'operation',
      operation: operation.id,
      title: operation.title,
      subtitle: operation.subtitle,
      description: operation.description,
    },
  }));

  return [
    ...sceneNodes,
    ...operationNodes,
    {
      id: 'output:timeline',
      type: 'outputNode',
      position: previousPositions.get('output:timeline') || { x: 430 + operations.length * 290, y: 120 },
      data: {
        kind: 'output',
        title: 'Timeline Output',
        subtitle: 'final assembly',
        description: 'Connect the last operation here to make the intended production path explicit.',
      },
    },
  ];
}

function buildDefaultEdges(storyboards: Storyboard[]): Edge[] {
  const sceneEdges = storyboards.map((sb) => ({
    id: `edge:scene:${sb.id}:image`,
    source: `scene:${sb.id}`,
    target: 'op:image',
    type: 'smoothstep',
    animated: false,
    markerEnd: { type: MarkerType.ArrowClosed },
  }));

  const operationEdges = operationOrder.slice(0, -1).map((operation, index) => ({
    id: `edge:op:${operation}:${operationOrder[index + 1]}`,
    source: `op:${operation}`,
    target: `op:${operationOrder[index + 1]}`,
    type: 'smoothstep',
    animated: true,
    style: { strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  }));

  return [
    ...sceneEdges,
    ...operationEdges,
    {
      id: 'edge:op:export:output',
      source: 'op:export',
      target: 'output:timeline',
      type: 'smoothstep',
      animated: true,
      style: { strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed },
    },
  ];
}

function CanvasModeContent({
  storyboards,
  onUpdate,
  onGenerateImage,
  onGenerateVideoPrompt,
  onGenerateAudio,
  onGenerateVideo,
}: CanvasModeProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editVideoPrompt, setEditVideoPrompt] = useState('');
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [runLog, setRunLog] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const initializedEdges = useRef(false);

  const storyboardById = useMemo(() => new Map(storyboards.map((sb) => [sb.id, sb])), [storyboards]);
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const selectedNode = selectedNodeId ? nodeById.get(selectedNodeId) : undefined;
  const selectedStoryboard = selectedNode?.data.storyboardId ? storyboardById.get(selectedNode.data.storyboardId) : undefined;
  const editingStoryboard = editingNodeId?.startsWith('scene:')
    ? storyboardById.get(editingNodeId.replace('scene:', ''))
    : undefined;

  const nodeTypes = useMemo(() => ({
    sceneNode: SceneNode,
    operationNode: OperationNode,
    outputNode: OutputNode,
  }), []);

  useEffect(() => {
    setNodes((current) => buildNodes(storyboards, current as WorkflowNode[]));
  }, [setNodes, storyboards]);

  useEffect(() => {
    if (initializedEdges.current || storyboards.length === 0) return;
    setEdges(buildDefaultEdges(storyboards));
    initializedEdges.current = true;
  }, [setEdges, storyboards]);

  const canConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) return false;
    const source = nodeById.get(connection.source);
    const target = nodeById.get(connection.target);
    if (!source || !target) return false;
    if (target.data.kind === 'scene') return false;
    if (source.data.kind === 'output') return false;
    if (source.data.kind === 'operation' && target.data.kind === 'operation') {
      const sourceIndex = operationOrder.indexOf(source.data.operation as OperationKind);
      const targetIndex = operationOrder.indexOf(target.data.operation as OperationKind);
      return sourceIndex !== -1 && targetIndex !== -1 && sourceIndex < targetIndex;
    }
    return target.data.kind === 'output';
  }, [nodeById]);

  const onConnect = useCallback((connection: Connection) => {
    if (!canConnect(connection)) return;
    setEdges((current) => {
      const duplicate = current.some((edge) => edge.source === connection.source && edge.target === connection.target);
      if (duplicate) return current;
      return addEdge({
        ...connection,
        id: `edge:${connection.source}:${connection.target}`,
        type: 'smoothstep',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
      }, current);
    });
  }, [canConnect, setEdges]);

  const startEdit = useCallback((storyboard: Storyboard) => {
    setEditingNodeId(`scene:${storyboard.id}`);
    setEditPrompt(storyboard.prompt);
    setEditVideoPrompt(storyboard.videoPrompt || '');
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingStoryboard || !onUpdate) return;
    onUpdate({ ...editingStoryboard, prompt: editPrompt, videoPrompt: editVideoPrompt });
    setEditingNodeId(null);
  }, [editPrompt, editVideoPrompt, editingStoryboard, onUpdate]);

  const resetLayout = useCallback(() => {
    setNodes(buildNodes(storyboards));
    setEdges(buildDefaultEdges(storyboards));
  }, [setEdges, setNodes, storyboards]);

  const getUpstreamScenes = useCallback((nodeId: string) => {
    const visited = new Set<string>();
    const result = new Set<string>();

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      const node = nodeById.get(id);
      if (node?.data.kind === 'scene' && node.data.storyboardId) {
        result.add(node.data.storyboardId);
        return;
      }
      edges.filter((edge) => edge.target === id).forEach((edge) => visit(edge.source));
    };

    visit(nodeId);
    return Array.from(result).map((id) => storyboardById.get(id)).filter(Boolean) as Storyboard[];
  }, [edges, nodeById, storyboardById]);

  const getDownstreamOperations = useCallback((nodeId: string) => {
    const visited = new Set<string>();
    const found = new Set<OperationKind>();

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      edges.filter((edge) => edge.source === id).forEach((edge) => {
        const target = nodeById.get(edge.target);
        if (target?.data.operation) found.add(target.data.operation);
        visit(edge.target);
      });
    };

    const node = nodeById.get(nodeId);
    if (node?.data.operation) found.add(node.data.operation);
    visit(nodeId);
    return operationOrder.filter((operation) => found.has(operation));
  }, [edges, nodeById]);

  const getOperationBlocker = useCallback((operation: OperationKind, storyboard: Storyboard) => {
    if (operation === 'videoPrompt' || operation === 'image') return null;
    if (operation === 'audio') {
      const hasDialogue = (storyboard.dialogueLines?.length ?? 0) > 0 || Object.keys(storyboard.dialogue || {}).length > 0;
      return hasDialogue ? null : 'no dialogue lines';
    }
    if (operation === 'video') {
      if (!storyboard.imageUrl) return 'image is not ready';
      if (storyboard.videoStatus === 'generating') return 'video is already generating';
    }
    return null;
  }, []);

  const runOperation = useCallback(async (operation: OperationKind, storyboard: Storyboard) => {
    if (operation === 'image') return onGenerateImage?.(storyboard);
    if (operation === 'videoPrompt') return onGenerateVideoPrompt?.(storyboard);
    if (operation === 'audio') return onGenerateAudio?.(storyboard);
    if (operation === 'video') return onGenerateVideo?.(storyboard);
    return undefined;
  }, [onGenerateAudio, onGenerateImage, onGenerateVideo, onGenerateVideoPrompt]);

  const runSelectedPath = useCallback(async () => {
    if (!selectedNodeId || isRunning) return;
    const operationsToRun = getDownstreamOperations(selectedNodeId).filter((operation) => operation !== 'export');
    const sourceScenes = selectedNode?.data.kind === 'scene' && selectedNode.data.storyboardId
      ? [storyboardById.get(selectedNode.data.storyboardId)].filter(Boolean) as Storyboard[]
      : getUpstreamScenes(selectedNodeId);

    if (sourceScenes.length === 0 || operationsToRun.length === 0) {
      setRunLog(['No runnable path. Connect scenes to operation nodes first.']);
      return;
    }

    setIsRunning(true);
    setRunLog([`Running ${operationsToRun.length} operation(s) for ${sourceScenes.length} scene(s).`]);
    try {
      for (const operation of operationsToRun) {
        for (const scene of sourceScenes) {
          const blocker = getOperationBlocker(operation, scene);
          if (blocker) {
            setRunLog((current) => [...current, `Scene ${scene.sceneNumber}: skipped ${operations.find((op) => op.id === operation)?.title} (${blocker})`]);
            continue;
          }
          setRunLog((current) => [...current, `Scene ${scene.sceneNumber}: ${operations.find((op) => op.id === operation)?.title}`]);
          await runOperation(operation, scene);
        }
      }
      setRunLog((current) => [...current, 'Workflow submitted. Generation status will update on the scene nodes.']);
    } finally {
      setIsRunning(false);
    }
  }, [getDownstreamOperations, getOperationBlocker, getUpstreamScenes, isRunning, runOperation, selectedNode, selectedNodeId, storyboardById]);

  const visibleClips = useMemo(() => {
    if (!selectedNodeId) return storyboards.filter((sb) => sb.videoUrl);
    const scenes = selectedNode?.data.kind === 'scene' && selectedNode.data.storyboardId
      ? [storyboardById.get(selectedNode.data.storyboardId)].filter(Boolean) as Storyboard[]
      : getUpstreamScenes(selectedNodeId);
    return scenes.filter((sb) => sb.videoUrl);
  }, [getUpstreamScenes, selectedNode, selectedNodeId, storyboardById, storyboards]);

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={canConnect}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onNodeDoubleClick={(_, node) => {
          if (node.data.videoUrl) setPreviewVideo(node.data.videoUrl);
        }}
        fitView
        className="bg-[var(--bg-primary)]"
        defaultEdgeOptions={{
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { strokeWidth: 2 },
        }}
      >
        <Background color="var(--border-color)" gap={24} size={1} />
        <Controls />
        <MiniMap
          pannable
          zoomable
          nodeColor={(node) => {
            if (node.data?.kind === 'scene') return '#007acc';
            if (node.data?.kind === 'operation') return '#4ec9b0';
            return '#dcdcaa';
          }}
          maskColor="rgba(0,0,0,0.25)"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
        />

        <Panel position="top-left">
          <div className="flex items-center gap-2 rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] p-2 shadow-lg">
            <div className="flex items-center gap-2 px-2 text-xs font-mono text-[var(--text-primary)]">
              <Layers3 size={14} />
              Workflow Canvas
            </div>
            <div className="h-6 w-px bg-[var(--border-color)]" />
            <button
              onClick={runSelectedPath}
              disabled={!selectedNodeId || isRunning}
              className="flex items-center gap-2 rounded bg-[var(--accent-blue)] px-3 py-2 text-xs font-mono text-white disabled:cursor-not-allowed disabled:opacity-50"
              title="Run the selected node and its connected downstream operations"
            >
              <Play size={13} />
              {isRunning ? 'Running' : 'Run Path'}
            </button>
            <button
              onClick={resetLayout}
              className="flex items-center gap-2 rounded border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-3 py-2 text-xs font-mono text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              title="Reset workflow nodes and default connections"
            >
              <Scissors size={13} />
              Reset
            </button>
          </div>
        </Panel>

        <Panel position="top-right">
          <div className="w-[360px] rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-mono text-[var(--text-primary)]">
                {selectedNode?.data.title || 'Select a node'}
              </h3>
              {selectedNodeId && (
                <button onClick={() => setSelectedNodeId(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title="Close details">
                  <X size={14} />
                </button>
              )}
            </div>

            {!selectedNode && (
              <p className="text-xs leading-5 text-[var(--text-secondary)]">
                Connect scene nodes to operations, then select any scene or operation and run that connected path.
              </p>
            )}

            {selectedStoryboard && !editingNodeId && (
              <div className="space-y-4">
                {selectedStoryboard.imageUrl && (
                  <img src={selectedStoryboard.imageUrl} alt={`Scene ${selectedStoryboard.sceneNumber}`} className="aspect-video w-full rounded border border-[var(--border-color)] object-contain" />
                )}
                <div>
                  <div className="mb-2 text-[11px] font-mono text-[var(--text-secondary)]">Image Prompt</div>
                  <p className="max-h-32 overflow-y-auto whitespace-pre-wrap text-xs leading-5 text-[var(--text-primary)]">{selectedStoryboard.prompt}</p>
                </div>
                {selectedStoryboard.videoPrompt && (
                  <div>
                    <div className="mb-2 text-[11px] font-mono text-[var(--text-secondary)]">Video Prompt</div>
                    <p className="max-h-28 overflow-y-auto whitespace-pre-wrap text-xs leading-5 text-[var(--text-primary)]">{selectedStoryboard.videoPrompt}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  {onUpdate && (
                    <button onClick={() => startEdit(selectedStoryboard)} className="flex flex-1 items-center justify-center gap-2 rounded border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-3 py-2 text-xs font-mono hover:bg-[var(--bg-hover)]">
                      <Edit2 size={13} />
                      Edit
                    </button>
                  )}
                  {selectedStoryboard.videoUrl && (
                    <button onClick={() => setPreviewVideo(selectedStoryboard.videoUrl!)} className="flex flex-1 items-center justify-center gap-2 rounded bg-[var(--accent-green)] px-3 py-2 text-xs font-mono text-white">
                      <Play size={13} />
                      Preview
                    </button>
                  )}
                </div>
              </div>
            )}

            {editingStoryboard && (
              <div className="space-y-3">
                <label className="block text-[11px] font-mono text-[var(--text-secondary)]">Image Prompt</label>
                <textarea
                  value={editPrompt}
                  onChange={(event) => setEditPrompt(event.target.value)}
                  className="h-28 w-full resize-none rounded border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
                <label className="block text-[11px] font-mono text-[var(--text-secondary)]">Video Prompt</label>
                <textarea
                  value={editVideoPrompt}
                  onChange={(event) => setEditVideoPrompt(event.target.value)}
                  className="h-28 w-full resize-none rounded border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="flex flex-1 items-center justify-center gap-2 rounded bg-[var(--accent-blue)] px-3 py-2 text-xs font-mono text-white">
                    <Save size={13} />
                    Save
                  </button>
                  <button onClick={() => setEditingNodeId(null)} className="flex-1 rounded border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-3 py-2 text-xs font-mono hover:bg-[var(--bg-hover)]">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {selectedNode?.data.kind === 'operation' && (
              <div className="space-y-4">
                <p className="text-xs leading-5 text-[var(--text-secondary)]">{selectedNode.data.description}</p>
                <div className="rounded border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-3">
                  <div className="mb-2 text-[11px] font-mono text-[var(--text-secondary)]">Connected Scenes</div>
                  <div className="text-xs text-[var(--text-primary)]">
                    {getUpstreamScenes(selectedNode.id).map((scene) => `Scene ${scene.sceneNumber}`).join(', ') || 'None'}
                  </div>
                </div>
              </div>
            )}

            {selectedNode?.data.kind === 'output' && (
              <div className="space-y-3">
                <p className="text-xs leading-5 text-[var(--text-secondary)]">{selectedNode.data.description}</p>
                {visibleClips.length === 0 ? (
                  <div className="rounded border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-3 text-xs text-[var(--text-secondary)]">
                    No completed clips connected yet.
                  </div>
                ) : visibleClips.map((clip) => (
                  <button
                    key={clip.id}
                    onClick={() => setPreviewVideo(clip.videoUrl!)}
                    className="flex w-full items-center justify-between rounded border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-3 py-2 text-left text-xs hover:bg-[var(--bg-hover)]"
                  >
                    <span>Scene {clip.sceneNumber}</span>
                    <Play size={13} />
                  </button>
                ))}
              </div>
            )}

            {runLog.length > 0 && (
              <div className="mt-4 border-t border-[var(--border-color)] pt-3">
                <div className="mb-2 text-[11px] font-mono text-[var(--text-secondary)]">Run Log</div>
                <div className="max-h-32 space-y-1 overflow-y-auto text-[11px] leading-5 text-[var(--text-secondary)]">
                  {runLog.map((entry, index) => <div key={`${entry}-${index}`}>{entry}</div>)}
                </div>
              </div>
            )}
          </div>
        </Panel>
      </ReactFlow>

      {previewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setPreviewVideo(null)}>
          <div className="relative flex h-full w-full items-center justify-center p-6" onClick={(event) => event.stopPropagation()}>
            <button onClick={() => setPreviewVideo(null)} className="absolute right-6 top-6 text-white hover:text-[var(--accent-blue)]" title="Close preview">
              <X size={24} />
            </button>
            <video src={previewVideo} controls autoPlay className="max-h-full max-w-full rounded border border-white/20" />
          </div>
        </div>
      )}
    </>
  );
}

export default function CanvasMode(props: CanvasModeProps) {
  return (
    <ReactFlowProvider>
      <div className="h-full w-full bg-[var(--bg-primary)]">
        <CanvasModeContent {...props} />
      </div>
    </ReactFlowProvider>
  );
}
