'use client';

import React, { useMemo } from 'react';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useTexture, Html } from '@react-three/drei';
import { useState } from 'react';
import * as THREE from 'three';
import StickyNote from '../components/notes';
import { X } from "lucide-react"
import { getNotes, createNote } from '../services/notes';
import Loader from '../components/Loader';

interface Note {
  id: string;
  content: string;
  position: THREE.Vector3;
  wall: string;
  color: string;
}


const STICKY_NOTE_COLORS = ['#FFB6C1', '#FFC0CB', '#FFD700', '#98FB98', '#87CEEB', '#DDA0DD'];

function Room({ notes, onWallClick, setOpenNoteId }: { notes: Note[], onWallClick: (wall: string, point: THREE.Vector3) => void, setOpenNoteId: (id: string) => void }) {
  const wallTexture = useTexture('/wall3.png');
  const wallTexture2 = useTexture('/wall2.jpg');
  const floorTexture = useTexture('/floor.png'); 

  // Pre-calculate all note positions and rotations
  const noteTransforms = useMemo(() => {
    const noteSize = 2;
    const gridSpacing = noteSize + 0.5;
    const wallGridCounters: Record<string, number> = {};
    const transforms = [];
    const gridCols = 10; 

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const position = note.position.clone();
      let rotation: [number, number, number] = [0, 0, 0];
      const randomRotation = (Math.random() - 0.5) * 0.2;

      
      const wallKey = note.wall || 'front';
      if (!wallGridCounters[wallKey]) wallGridCounters[wallKey] = 0;
      const gridIndex = wallGridCounters[wallKey]++;
      const col = gridIndex % gridCols;
      const row = Math.floor(gridIndex / gridCols);
      // Center the grid around (0,0)
      const gridX = (col - gridCols / 2) * gridSpacing;
      const gridY = (row - 2) * gridSpacing;

      if (note.wall === 'back') {
        position.set(gridX, gridY, -50 + 0.1);
        rotation = [0, 0, randomRotation];
      } else if (note.wall === 'front') {
        position.set(gridX, gridY, 50 - 0.1);
        rotation = [0, Math.PI, randomRotation];
      } else if (note.wall === 'left') {
        position.set(-50 + 0.1, gridY, gridX);
        rotation = [0, Math.PI / 2, randomRotation];
      } else if (note.wall === 'right') {
        position.set(50 - 0.1, gridY, gridX);
        rotation = [0, -Math.PI / 2, randomRotation];
      } else if (note.wall === 'floor') {
        position.set(gridX, -25 + 0.1, gridY);
        rotation = [-Math.PI / 2, 0, randomRotation];
      }

      transforms.push({ position, rotation });
    }

    return transforms;
  }, [notes]);


  const [hoveredNoteId, setHoveredNoteId] = React.useState<string | null>(null);

  const handleWallClick = (wall: string) => (event: ThreeEvent<MouseEvent>) => {
    
    if (event.button !== 2) return;
    const mesh = event.object;
    const point = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(mouse, event.camera);
    const intersects = raycaster.intersectObject(mesh);
    if (intersects.length > 0) {
      point.copy(intersects[0].point);
      onWallClick(wall, point);
    }
  };

  // Room dimensions
  const size = 100;
  const height = 50;

  return (
    <group>
      <mesh position={[0, -height / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} onContextMenu={handleWallClick('floor')}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial map={floorTexture} />
      </mesh>
      
      <mesh position={[0, 0, -size / 2]} onContextMenu={handleWallClick('back')}>
        <planeGeometry args={[size, height]} />
        <meshStandardMaterial map={wallTexture} />
      </mesh>
      {/* Front Wall */}
      <mesh position={[0, 0, size / 2]} rotation={[0, Math.PI, 0]} onContextMenu={handleWallClick('front')}>
        <planeGeometry args={[size, height]} />
        <meshStandardMaterial map={wallTexture} />
      </mesh>
      {/* Left Wall */}
      <mesh position={[-size / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} onContextMenu={handleWallClick('left')}>
        <planeGeometry args={[size, height]} />
        <meshStandardMaterial map={wallTexture2} />
      </mesh>
      {/* Right Wall */}
      <mesh position={[size / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]} onContextMenu={handleWallClick('right')}>
        <planeGeometry args={[size, height]} />
        <meshStandardMaterial map={wallTexture} />
      </mesh>
      {/* Notes */}
      {notes.map((note, index) => {
        const { position, rotation } = noteTransforms[index];
        return (
          <group key={note.id}>
            <mesh 
              position={position} 
              rotation={rotation} 
              onClick={() => setOpenNoteId(note.id)}
              onPointerOver={e => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
                setHoveredNoteId(note.id);
              }}
              onPointerOut={e => {
                e.stopPropagation();
                document.body.style.cursor = 'auto';
                setHoveredNoteId(null);
              }}
            >
              <boxGeometry args={[2, 2, 0.1]} />
              <meshStandardMaterial
                color={note.color}
                roughness={0.2}
                metalness={0.1}
                emissive={note.color}
                emissiveIntensity={0.5}
              />
            </mesh>
            {/* Tooltip above the note*/}
            {hoveredNoteId === note.id && (
              <Html 
                position={[position.x, position.y + 1.4, position.z]} 
                center 
                style={{ 
                  pointerEvents: 'none', 
                  zIndex: 10,
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <div
                  className='cursor-pointer border border-gray-300 capitalize overflow-hidden text-black bg-white p-1 px-2 rounded-md text-[12px] whitespace-nowrap max-w-[120px] text-ellipsis mb-12 hover:scale-105 transition-transform'
                >
                  <div className="absolute top-9 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gray-300 rounded-full shadow-sm flex items-center justify-center">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  </div>
                  {note.content.length > 20 ? note.content.slice(0, 20) + '…' : note.content}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

function hasResponse(obj: unknown): obj is { response: { status: number } } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'response' in obj &&
    typeof (obj as { response?: unknown }).response === 'object' &&
    (obj as { response: { status?: unknown } }).response?.status !== undefined
  );
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteColor, setNewNoteColor] = useState(STICKY_NOTE_COLORS[Math.floor(Math.random() * STICKY_NOTE_COLORS.length)]);
  const [clickPosition, setClickPosition] = useState<THREE.Vector3 | null>(null);
  const [clickedWall, setClickedWall] = useState<string | null>(null);
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [postingNote, setPostingNote] = useState(false);

  // Detect mobile device
  const isMobile = typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);

  // Fetch notes from the API on mount
  React.useEffect(() => {
    (async () => {
      setLoadingNotes(true);
      try {
        const apiNotes = await getNotes();
        // Convert position to THREE.Vector3
        setNotes(apiNotes.map((n: Note) => ({
          ...n,
          position: new THREE.Vector3(n.position.x, n.position.y, n.position.z),
        })));
      } catch (error) {
        console.error('Error fetching notes:', error);
      } finally {
        setLoadingNotes(false);
      }
    })();
  }, []);

  const randomOffset = () => (Math.random() - 0.5) * 10; 

  const handleRoomClick = (wall: string, point: THREE.Vector3) => {
    // if (localStorage.getItem('hasPostedNote')) {
    //   alert('You can only post one note from this device!');
    //   return;
    // }
    
    setClickPosition(new THREE.Vector3(
      point.x + (Math.random() - 0.5) * 2, 
      point.y + (Math.random() - 0.5) * 3,
      point.z
    ));
    setClickedWall(wall);
    setIsCreatingNote(true);
  };

  const handleCreateNote = async () => {
    if (newNoteContent.trim() && clickPosition) {
      const newNote = {
        id: Date.now().toString(),
        content: newNoteContent,
        position: { x: clickPosition.x, y: clickPosition.y, z: clickPosition.z },
        wall: clickedWall || '',
        color: newNoteColor,
      };
      setPostingNote(true);
      try {
        await createNote(newNote);
        //localStorage.setItem('hasPostedNote', 'true');
        // Refresh notes from API
        const apiNotes = await getNotes();
        setNotes(apiNotes.map((n: Note) => ({
          ...n,
          position: new THREE.Vector3(n.position.x, n.position.y, n.position.z),
        })));
        setNewNoteContent('');
        setNewNoteColor(STICKY_NOTE_COLORS[Math.floor(Math.random() * STICKY_NOTE_COLORS.length)]);
        setIsCreatingNote(false);
        setClickPosition(null);
        setClickedWall(null);
      } catch (err: unknown) {
        if (hasResponse(err) && err.response.status === 403) {
          // localStorage.setItem('hasPostedNote', 'true');
          alert('Posting limit reached.');

        } else {
          alert('An error occurred while posting your note.');
        }
      } finally {
        setPostingNote(false);
      }
    }
  };

  return (
    <main className="w-screen h-screen bg-blue-300 relative">
      {/* Total Notes Badge */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-3 bg-black text-white font-bold shadow-lg text-sm">
        {notes.length} note{notes.length !== 1 ? 's' : ''}
      </div>
      <div className='w-full absolute bottom-0 left-0 z-10 pointer-events-none'>
        <div className="w-full p-5">
          <div className="max-w-2xl relative">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-lg -z-10"></div>
            <div className="relative z-10 pointer-events-auto p-2">
              <h1 className='text-white text-md md:text-xl font-bold'>Welcome to Wall of Stories</h1>
              <p className='text-white text-xs md:text-sm mb-6'>A virtual space where you can leave anonymous notes on the walls. Share your thoughts, ideas, or messages with others. Right-click anywhere on the walls to create a new note and "double tap to see around".</p>
            </div>
          </div>
        </div>
      </div>
      <Canvas className="w-full h-full" style={{ zIndex: 1, position: 'relative' }}>
        <PerspectiveCamera makeDefault position={[0, 0, 22]} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={12}
          maxDistance={40}
        />
        <ambientLight intensity={1.0} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <pointLight position={[-10, 10, -10]} intensity={1.5} />
        <Room notes={notes} onWallClick={handleRoomClick} setOpenNoteId={setOpenNoteId} />
      </Canvas>

      
      {loadingNotes && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-30">
          <Loader />
        </div>
      )}

      {/* Note Creation Modal */}
      {isCreatingNote && (
        <div className="z-[99999] fixed inset-0 flex items-center justify-center" style={{ background: 'transparent' }}>
          <div className="p-6 rounded-lg w-96 flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-white">Create Your Note</h2>
            <StickyNote
              id="draft"
              initialContent={newNoteContent}
              initialColor={newNoteColor}
              editable={true}
              onContentChange={setNewNoteContent}
            />
            <div className="flex justify-center gap-2 mt-4 w-full">
              <button
                className="cursor-pointer px-4 py-2 bg-gray-200 rounded-lg"
                onClick={() => setIsCreatingNote(false)}
                disabled={postingNote}
              >
                Cancel
              </button>
              <button
                className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center justify-center min-w-[100px]"
                onClick={handleCreateNote}
                disabled={postingNote}
              >
                {postingNote ? "Posting..." : 'Post Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      
      {openNoteId && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'transparent' }}>
          <div className="relative">
            <StickyNote
              id={openNoteId}
              initialContent={notes.find(n => n.id === openNoteId)?.content || ''}
              initialColor={notes.find(n => n.id === openNoteId)?.color || 'yellow'}
              editable={false}
            />
            <button
              onClick={() => setOpenNoteId(null)}
              className="cursor-pointer absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Delete note"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {isMobile && !isCreatingNote && (
        <button
          className="fixed top-6 right-6 z-50 bg-green-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl shadow-lg"
          onClick={() => {
            // if (localStorage.getItem('hasPostedNote')) {
            //   alert('You can only post one note from this device!');
            //   return;
            // }
            setClickedWall('front');
            
            setClickPosition(new THREE.Vector3(randomOffset(), randomOffset(), 50 - 0.1));
            setIsCreatingNote(true);
          }}
        >
          +
        </button>
      )}

      {isMobile && (
        <div
          className="pointer-events-none fixed left-1/2 top-1/2 z-50"
          style={{
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-50 opacity-80 border-4 border-white shadow-lg">+</div>
        </div>
      )}
    </main>
  );
}