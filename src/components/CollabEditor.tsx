import React, { useEffect, useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { yCollab } from 'y-codemirror.next';
import { Users } from 'lucide-react';

interface CollabEditorProps {
  noteId: string;
  initialContent: string;
  roomPassword?: string;
  onChange?: (content: string) => void;
  userName?: string;
}

export function CollabEditor({ noteId, initialContent, roomPassword, onChange, userName = 'Anonymous' }: CollabEditorProps) {
  const [provider, setProvider] = useState<WebrtcProvider | null>(null);
  const [syncedStatus, setSyncedStatus] = useState<string>('Connecting...');
  const [peers, setPeers] = useState<number>(0);

  const ydoc = useMemo(() => new Y.Doc(), []);
  const ytext = useMemo(() => ydoc.getText('codemirror'), [ydoc]);

  useEffect(() => {
    // Only initialize with initialContent if document is empty
    if (initialContent && ytext.toString() === '') {
      ytext.insert(0, initialContent);
    }
  }, []); // Run once

  useEffect(() => {
    if (!roomPassword) return;

    const webrtcProvider = new WebrtcProvider(noteId, ydoc, {
      signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com', 'wss://y-webrtc-signaling-us.herokuapp.com'],
      password: roomPassword,
    });
    
    webrtcProvider.awareness.setLocalStateField('user', {
      name: userName,
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    });

    webrtcProvider.on('status', (event: any) => {
      if (event.connected) {
         setSyncedStatus('Connected internally');
      }
    });

    webrtcProvider.awareness.on('change', () => {
       setPeers(Array.from(webrtcProvider.awareness.getStates().keys()).length);
    });

    setProvider(webrtcProvider);

    return () => {
      webrtcProvider.destroy();
    };
  }, [noteId, roomPassword, ydoc, userName]);

  useEffect(() => {
    if (!onChange) return;
    let timeout: any;
    const observer = (event: Y.YTextEvent, transaction: Y.Transaction) => {
      if (transaction.local) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          onChange(ytext.toString());
        }, 1000); // debounce 1 second to avoid killing firestore
      }
    };
    ytext.observe(observer);
    return () => {
      clearTimeout(timeout);
      ytext.unobserve(observer);
    };
  }, [ytext, onChange]);

  const extensions = useMemo(() => {
    const exts: any[] = [markdown()];
    if (provider) {
      exts.push(yCollab(ytext, provider.awareness));
    }
    return exts;
  }, [provider, ytext]);

  if (!roomPassword) {
     return <div className="p-4 text-slate-500">Wait, no room password provided.</div>;
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-[28px] overflow-hidden border border-slate-800">
      <div className="flex items-center justify-between px-6 py-3 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">E2EE Collab Protocol</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-300">{peers} Peer{peers !== 1 ? 's' : ''}</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto collab-editor-container" style={{ fontSize: '18px' }}>
        <CodeMirror
          value={ytext.toString()}
          extensions={extensions}
          theme={oneDark}
          className="h-full"
          height="100%"
          basicSetup={{
             lineNumbers: false,
             foldGutter: false,
             highlightActiveLine: false,
             autocompletion: true,
          }}
        />
      </div>
      <style>{`
        .collab-editor-container .cm-editor {
          height: 100%;
          background: transparent !important;
        }
        .collab-editor-container .cm-scroller {
          padding: 24px;
        }
        .collab-editor-container .cm-content {
          font-family: inherit;
        }
        /* Yjs Cursors */
        .yRemoteSelection { background-color: rgba(250, 129, 0, 0.2); }
        .yRemoteSelectionHead {
          position: absolute;
          border-left: 2px solid orange;
          border-top: 2px solid orange;
          border-bottom: 2px solid orange;
          height: 1.2em;
          box-sizing: border-box;
          display: inline-block;
          z-index: 10;
        }
        .yRemoteSelectionHead::after {
          position: absolute;
          content: attr(data-user-name);
          background-color: orange;
          color: white;
          font-size: 10px;
          top: -16px;
          left: -2px;
          padding: 0 4px;
          white-space: nowrap;
          border-radius: 4px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}
